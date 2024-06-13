import { w3cwebsocket as W3CWebSocket } from "websocket"

//const wsBaseUrl = "localhost:8080" //local dev
const wsBaseUrl = "witch-chess-backend.fly.dev" //production
let socket

if (wsBaseUrl === 'localhost:8080') {
    socket = 'ws'
} else {
    socket = 'wss'
}

export function createClient(lobby_code) {

    const client = new W3CWebSocket(`${socket}://${wsBaseUrl}/ws/game/` + lobby_code + '/');

    client.onerror = function() {
        console.log('Connection Error');
    };
    
    client.onopen = function() {
        console.log('WebSocket Client Connected');

        function requestInit() {
            client.send(JSON.stringify({
                "dispatch": "init",
                "turn": "",
                "message": "",
            }))
        }

        setTimeout(requestInit, 1000)
    
        // function sendNumber() {
        //     if (client.readyState === client.OPEN) {
        //         let number = Math.round(Math.random() * 0xFFFFFF);
        //         client.send(JSON.stringify({
        //             'message': dummy_id + number.toString(),
        //         }));
        //         //setTimeout(sendNumber, 10000);
        //     }
        // }
        // sendNumber();
    };
    
    client.onclose = function() {
        console.log('Client Closed');
    };
    
    // client.onmessage is set LATER by the board using the socket
    
    return client
}