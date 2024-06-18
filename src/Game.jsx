// is the game screen, handles all parts of the actual game and also our websockets

import { useState, useEffect, useContext } from "react"

import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"

import { TextField } from "@mui/material"
import { Button } from "@mui/material"

import PersonIcon from '@mui/icons-material/Person';

import Board from "./GameBoard"

import { AuthContext } from "./authContext"
import { fetchLobbies } from "./api"

import { v4 as uuidv4 } from "uuid"

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
            <h3 className="py-2 text-center text-white">Create A Lobby</h3>
            <Col className="text-center text-white d-flex justify-content-center">
                
                <TextField label="Lobby Name" className="lobby-input me-1" size="small" 
                variant="filled" value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/>
                
                {/* <input value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/> */}
                
                <Button variant="contained" className="mybutton ms-1" onClick={() => submit()}>Enter Lobby</Button>
            </Col>
        </Container>
    )
}

function LobbyListEntry(props) {
    const name = props.name
    const playerCount = props.playerCount
    const join = props.join

    let buttonText
    if (playerCount < 2) {
        buttonText = "JOIN"
    } else {
        buttonText = "SPECTATE"
    }

    return (
        <Row className="py-2">
            <Col>{name}</Col>
            <Col><PersonIcon/> {playerCount} / 2</Col>
            <Col>
                <Button variant="contained" className="mybutton" onClick={() => join(name)}>{buttonText}</Button>
            </Col>
        </Row>
    )
}

function LobbyList(props) {
    //lists out the public lobbies
    const { auth } = useContext(AuthContext)
    const [lobbies, setLobbies] = useState({})

    const setElement = props.setElement

    useEffect(() => {
        fetchLobbies({ auth, setLobbies })
    }, [])

    function join(lobbyCode) {
        //join the provided lobby
        if (lobbyCode) {
            setElement(<Board lobby={lobbyCode} />)
        }
    }

    let lobbyElements = []
    for (const [key, value] of Object.entries(lobbies)) {
        if (value.black || value.white) { //at least one player present
            let pCount = 0
            if (value.black) {
                pCount += 1
            }
            if (value.white) {
                pCount += 1
            }

            lobbyElements.push(<LobbyListEntry key={uuidv4()} name={value.lobby_code} playerCount={pCount} join={join}/>)
        }
    }  
    
    return (
        <Container className="text-center py-5">
            <Col className="col-12 col-md-6 mx-auto border lobby-list">
                
                <h3 className="py-2">PUBLIC LOBBIES</h3>
                {/* <Col className="col-12 py-2 border">PUBLIC LOBBIES</Col> */}
                <Col className="col-12 py-2 border">
                    {/* <LobbyListEntry name="NAME" playerCount={1} />
                    <LobbyListEntry name="NAME" playerCount={1} />
                    <LobbyListEntry name="NAME" playerCount={1} /> */}
                    {lobbyElements}
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
            <LobbyList setElement={setElement}/>
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