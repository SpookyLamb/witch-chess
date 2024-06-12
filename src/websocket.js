import { w3cwebsocket as W3CWebSocket } from "websocket"

export function createClient() {

    let client = new W3CWebSocket('ws://127.0.0.1:8000/ws/game/'); //'echo-protocol'

    client.onerror = function() {
        console.log('Connection Error');
    };
    
    client.onopen = function() {
        console.log('WebSocket Client Connected');
    
        function sendNumber() {
            if (client.readyState === client.OPEN) {
                let number = Math.round(Math.random() * 0xFFFFFF);
                client.send(JSON.stringify({
                    'message': number.toString(),
                }));
                setTimeout(sendNumber, 10000);
            }
        }
        sendNumber();
    };
    
    client.onclose = function() {
        console.log('Client Closed');
    };
    
    client.onmessage = function(e) {
        if (typeof e.data === 'string') {
            console.log("Received: '" + e.data + "'");
        }
    };
    
    return client
}