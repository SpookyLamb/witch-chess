import { w3cwebsocket as W3CWebSocket } from "websocket"
import { wsBaseUrl } from "./api"

let socket

if (wsBaseUrl === '127.0.0.1:8000') {
    socket = 'ws'
} else {
    socket = 'wss'
}

export function createClient(lobby_code, lobbyPrivate) {

    //remove any funky characters
    lobby_code = lobby_code.replaceAll(' ', "")
    lobby_code = lobby_code.replaceAll('-', "")
    lobby_code = lobby_code.replaceAll('_', "")

    const client = new W3CWebSocket(`${socket}://${wsBaseUrl}/ws/game/` + lobby_code + '/');

    client.onerror = function() {
        console.log('Connection Error');
    };
    
    client.onopen = function() {
        console.log('WebSocket Client Connected');

        function requestInit() {

            if (lobbyPrivate) { //guards against bad data
                lobbyPrivate = true
            } else {
                lobbyPrivate = false
            }

            client.send(JSON.stringify({
                "dispatch": "init",
                "turn": "",
                "message": lobbyPrivate,
            }))
        }

        setTimeout(requestInit, 100)
    };
    
    client.onclose = function() {
        console.log('Client Closed');
    };
    
    // client.onmessage is set LATER by the board using the socket
    
    return client
}