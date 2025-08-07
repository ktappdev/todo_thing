package websocket

import "encoding/json"

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func BroadcastToHousehold(householdID string, eventType string, payload interface{}) {
	if !Enabled() {
		return
	}
	msg, _ := json.Marshal(Event{Type: eventType, Data: payload})
	GetHub().broadcast <- roomMessage{room: RoomHousehold(householdID), data: msg}
}
