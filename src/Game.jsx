// is the game screen, handles all parts of the actual game and also our websockets

import { useState, useEffect } from "react"

import Board from "./GameBoard"

function LobbyInput(props) {
    const [lobbyCode, setLobbyCode] = useState("")
    const setElement = props.setElement

    function submit() {
        setElement(<Board lobby={lobbyCode} />)
    }

    return (
        <div>
            <input value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/>
            <button className="mybutton" onClick={() => submit()}>Enter Lobby</button>
        </div>
    )
}

function Game() {
    const [element, setElement] = useState()

    useEffect(() => {
        setElement(<LobbyInput setElement={setElement}/>)
    }, [])

    return (
        <div>
            {element}
        </div>
    )
}

export default Game