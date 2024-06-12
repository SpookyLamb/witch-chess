// is the game screen, handles all parts of the actual game and also our websockets

import Board from "./GameBoard"
import { createClient } from "./websocket"
import { useEffect } from "react"

function Game() {
    
    useEffect(() => {
        createClient()
    }, [])

    return (
        <div>
            <Board/>
        </div>
    )
}

export default Game