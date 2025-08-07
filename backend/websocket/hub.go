package websocket

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"household-todo-backend/utils"
)

type Client struct {
	conn          *websocket.Conn
	send          chan []byte
	userID        string
	householdID   string
	authenticated bool
	rooms         map[string]struct{}
	mu            sync.Mutex
}

type Hub struct {
	clients    map[*Client]struct{}
	rooms      map[string]map[*Client]struct{}
	register   chan *Client
	unregister chan *Client
	joinRoom   chan joinLeaveReq
	leaveRoom  chan joinLeaveReq
	broadcast  chan roomMessage
	upgrader   websocket.Upgrader
}

type joinLeaveReq struct {
	client *Client
	room   string
}

type roomMessage struct {
	room string
	data []byte
}

var hub *Hub
var once sync.Once

func GetHub() *Hub {
	once.Do(func() {
		hub = &Hub{
			clients:    make(map[*Client]struct{}),
			rooms:      make(map[string]map[*Client]struct{}),
			register:   make(chan *Client),
			unregister: make(chan *Client),
			joinRoom:   make(chan joinLeaveReq),
			leaveRoom:  make(chan joinLeaveReq),
			broadcast:  make(chan roomMessage, 256),
			upgrader: websocket.Upgrader{
				CheckOrigin: func(r *http.Request) bool { return true },
			},
		}
		go hub.run()
	})
	return hub
}

func (h *Hub) run() {
	for {
		select {
		case c := <-h.register:
			h.clients[c] = struct{}{}
		case c := <-h.unregister:
			if _, ok := h.clients[c]; ok {
				for room := range c.rooms {
					if members, ok := h.rooms[room]; ok {
						delete(members, c)
						if len(members) == 0 {
							delete(h.rooms, room)
						}
					}
				}
				delete(h.clients, c)
				close(c.send)
				c.conn.Close()
			}
		case req := <-h.joinRoom:
			if _, ok := h.rooms[req.room]; !ok {
				h.rooms[req.room] = make(map[*Client]struct{})
			}
			h.rooms[req.room][req.client] = struct{}{}
			req.client.mu.Lock()
			req.client.rooms[req.room] = struct{}{}
			req.client.mu.Unlock()
		case req := <-h.leaveRoom:
			if members, ok := h.rooms[req.room]; ok {
				delete(members, req.client)
				if len(members) == 0 {
					delete(h.rooms, req.room)
				}
			}
			req.client.mu.Lock()
			delete(req.client.rooms, req.room)
			req.client.mu.Unlock()
		case msg := <-h.broadcast:
			if members, ok := h.rooms[msg.room]; ok {
				for c := range members {
					select {
					case c.send <- msg.data:
					default:
					}
				}
			}
		}
	}
}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	c := &Client{
		conn:          conn,
		send:          make(chan []byte, 256),
		rooms:         make(map[string]struct{}),
		authenticated: false,
	}
	h.register <- c
	go c.writePump()
	go c.readPump()
	token := ""
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		token = strings.TrimSpace(authHeader[7:])
	}
	if token == "" {
		token = r.URL.Query().Get("token")
	}
	if token != "" {
		c.tryAuthenticate(token)
	}
	if c.authenticated && c.householdID != "" {
		h.joinRoom <- joinLeaveReq{client: c, room: RoomHousehold(c.householdID)}
	}
}

func (c *Client) tryAuthenticate(token string) {
	claims, err := utils.ValidateJWT(token)
	if err != nil {
		return
	}
	c.userID = claims.UserID
	c.householdID = claims.HouseholdID
	c.authenticated = true
}

func (c *Client) readPump() {
	defer func() {
		GetHub().unregister <- c
	}()
	c.conn.SetReadLimit(1 << 20)
	_ = c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		var frame map[string]interface{}
		_ = json.Unmarshal(message, &frame)
		t, _ := frame["type"].(string)
		switch t {
		case "auth":
			if tok, ok := frame["token"].(string); ok {
				if !c.authenticated {
					c.tryAuthenticate(tok)
					if c.authenticated && c.householdID != "" {
						GetHub().joinRoom <- joinLeaveReq{client: c, room: RoomHousehold(c.householdID)}
					}
				}
			}
		case "join:household":
			if !c.authenticated {
				continue
			}
			if hid, ok := frame["householdId"].(string); ok && hid == c.householdID {
				GetHub().joinRoom <- joinLeaveReq{client: c, room: RoomHousehold(hid)}
			}
		case "leave:household":
			if !c.authenticated {
				continue
			}
			if hid, ok := frame["householdId"].(string); ok && hid == c.householdID {
				GetHub().leaveRoom <- joinLeaveReq{client: c, room: RoomHousehold(hid)}
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(45 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, []byte("ping")); err != nil {
				return
			}
		}
	}
}

func RoomHousehold(id string) string {
	return "household:" + id
}

func Enabled() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("WEBSOCKET_ENABLED")))
	return v == "" || v == "1" || v == "true" || v == "yes"
}
