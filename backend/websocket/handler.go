package websocket

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	if !Enabled() {
		return
	}
	r.GET("/ws", func(c *gin.Context) {
		GetHub().ServeWS(c.Writer, c.Request)
	})
}
