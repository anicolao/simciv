package engine

import (
"encoding/json"
"fmt"
"log"
"net/http"
)

// TickRequest represents a manual tick request
type TickRequest struct {
GameID string `json:"gameId"`
}

// TickResponse represents the response to a tick request
type TickResponse struct {
Success bool   `json:"success"`
Message string `json:"message,omitempty"`
Error   string `json:"error,omitempty"`
}

// StartControlServer starts an HTTP server for manual tick control (E2E mode only)
func StartControlServer(engine *GameEngine, port int) {
if !engine.e2eTestMode {
log.Println("Control server is only available in E2E test mode")
return
}

http.HandleFunc("/tick", func(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
return
}

var req TickRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
resp := TickResponse{
Success: false,
Error:   "Invalid request body",
}
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusBadRequest)
json.NewEncoder(w).Encode(resp)
return
}

if req.GameID == "" {
resp := TickResponse{
Success: false,
Error:   "gameId is required",
}
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusBadRequest)
json.NewEncoder(w).Encode(resp)
return
}

// Trigger manual tick
if err := engine.TriggerManualTick(req.GameID); err != nil {
resp := TickResponse{
Success: false,
Error:   fmt.Sprintf("Failed to trigger tick: %v", err),
}
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusInternalServerError)
json.NewEncoder(w).Encode(resp)
return
}

resp := TickResponse{
Success: true,
Message: fmt.Sprintf("Tick triggered for game %s", req.GameID),
}
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resp)
})

http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(map[string]string{
"status": "ok",
"mode":   "e2e-test",
})
})

addr := fmt.Sprintf(":%d", port)
log.Printf("Starting engine control server on %s (E2E test mode)", addr)

go func() {
if err := http.ListenAndServe(addr, nil); err != nil {
log.Printf("Control server error: %v", err)
}
}()
}
