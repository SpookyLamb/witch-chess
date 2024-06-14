// is the game screen, handles all parts of the actual game and also our websockets

import { useState, useEffect } from "react"

import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"

import Board from "./GameBoard"

function LobbyInput(props) {
    const [lobbyCode, setLobbyCode] = useState("")
    const setElement = props.setElement

    function submit() {
        setElement(<Board lobby={lobbyCode} />)
    }

    return (
        <Container>
            <Col className="text-center">
                <input value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/>
                <button className="mybutton" onClick={() => submit()}>Enter Lobby</button>
            </Col>
        </Container>
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