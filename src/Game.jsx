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
        if (lobbyCode) {
            setElement(<Board lobby={lobbyCode} />)
        } else {
            alert("Please enter a name for your lobby!")
        }
    }

    return (
        <Container className="py-5">
            <Col className="text-center">
                <input value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/>
                <button className="mybutton" onClick={() => submit()}>Enter Lobby</button>
            </Col>
        </Container>
    )
}

function LobbyListEntry(props) {
    const name = props.name
    const playerCount = props.playerCount

    return (
        <Row>
            <Col>{name}</Col>
            <Col>PLAYERS: {playerCount}</Col>
            <Col>JOIN BUTTON</Col>
        </Row>
    )
}

function LobbyList() {
    //lists out the public lobbies
    return (
        <Container className="text-center py-5">
            <Col className="col-12 col-md-6 mx-auto border">
                
                <Col className="col-12 py-2 border">PUBLIC LOBBIES</Col>
                <Col className="col-12 py-2 border">
                    <LobbyListEntry name="NAME" playerCount={1} />
                    <LobbyListEntry name="NAME" playerCount={1} />
                    <LobbyListEntry name="NAME" playerCount={1} />
                </Col>
            </Col>
        </Container>
    )
}

function Lobby(props) {
    const setElement = props.setElement

    return (
        <div>
            <Title/>
            <LobbyInput setElement={setElement}/>
            <LobbyList/>
        </div>
    )
}

function Title() {
    return (
        <h1 className="text-white text-center">
            WITCH CHESS
        </h1>
    )
}

function RulesButton() {
    return (
        <div>

        </div>
    )
}

function Rules() {
    return (
        <div>

        </div>
    )
}

function Game() {
    const [element, setElement] = useState()

    useEffect(() => {
        setElement(<Lobby setElement={setElement}/>)
    }, [])

    return (
        <div>
            {element}
        </div>
    )
}

export default Game