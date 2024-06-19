// is the game screen, handles all parts of the actual game and also our websockets

import { useState, useEffect, useContext } from "react"

import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"

import { TextField } from "@mui/material"
import { Button } from "@mui/material"
import { IconButton } from "@mui/material"

import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';

import Board from "./GameBoard"

import { AuthContext } from "./authContext"
import { fetchLobbies } from "./api"

import { v4 as uuidv4 } from "uuid"

import { debug } from "./api"

let imgUrl = "assets"

if (debug) {
    imgUrl = "src/assets"
}

//pictures
const imageSources = {    
    blackKing: `${imgUrl}/black-king.png`,
    blackQueen: `${imgUrl}/black-queen.png`,
    blackPawn: `${imgUrl}/black-pawn.png`,
    blackRook: `${imgUrl}/black-rook.png`,
    blackKnight: `${imgUrl}/black-knight.png`,
    blackBishop: `${imgUrl}/black-bishop.png`,

    whiteKing: `${imgUrl}/white-king.png`,
    whiteQueen: `${imgUrl}/white-queen.png`,
    whitePawn: `${imgUrl}/white-pawn.png`,
    whiteRook: `${imgUrl}/white-rook.png`,
    whiteKnight: `${imgUrl}/white-knight.png`,
    whiteBishop: `${imgUrl}/white-bishop.png`,
}

function LobbyInput(props) {
    const [lobbyCode, setLobbyCode] = useState("")
    const [lobbyPrivate, setLobbyPrivate] = useState(false)
    const setElement = props.setElement

    const handleOnChange = () => {
        setLobbyPrivate(!lobbyPrivate)
    }

    function submit() {
        if (lobbyCode) {
            setElement(<Board lobby={lobbyCode} lobbyPrivate={lobbyPrivate}/>)
        } else {
            alert("Please enter a name for your lobby!")
        }
    }

    return (
        <Container className="py-5">
            <h3 className="py-2 text-center text-white">Create/Join A Lobby</h3>
            <Col className="text-center text-white d-flex justify-content-center">
                
                <TextField label="Lobby Name" className="lobby-input me-1" size="small" 
                variant="filled" value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/>
                
                {/* <input value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/> */}
                
                <Button variant="contained" className="mybutton ms-1" onClick={() => submit()}>GO</Button>
            </Col>
            <Col className="pt-2 text-center text-white d-flex justify-content-center">
                <label htmlFor="privacy">Private?:&nbsp;&nbsp;</label>
                <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    checked={lobbyPrivate}
                    onChange={handleOnChange}
                />
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
            if (value.private) {
                continue //private lobbies are ignored and not displayed
            }

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

    if (lobbyElements.length < 1) {
        lobbyElements = "No open lobbies. :("
    }
    
    return (
        <Container className="text-center py-5">
            <Col className="col-12 col-md-6 mx-auto border lobby-list">
                <Col className="fs-3 pt-2">
                        Public Lobbies
                </Col>
                <Col>
                    <RefreshButton setLobbies={setLobbies} />
                </Col>

                <Col className="col-12 py-2 border">
                    {lobbyElements}
                </Col>
            </Col>
        </Container>
    )
}

function RefreshButton(props) {
    const { auth } = useContext(AuthContext)
    const setLobbies = props.setLobbies

    function refreshLobbies() {
        fetchLobbies({ auth, setLobbies })
    }

    return (
        <IconButton className="myiconbutton" aria-label="refresh lobbies" onClick={() => refreshLobbies()}>
            <RefreshIcon/>
        </IconButton>
    )
}

function Lobby(props) {
    const setElement = props.setElement
    const [rulesVisible, setRulesVisible] = useState(false)

    let rules
    if (rulesVisible) {
        rules = <Rules setRulesVisible={setRulesVisible}/>
    } else {
        rules = <></>
    }

    return (
        <div>
            {rules}
            <Title/>
            <LobbyInput setElement={setElement}/>
            <RulesButton setRulesVisible={setRulesVisible}/>
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

function RulesButton(props) {
    const setRulesVisible = props.setRulesVisible

    function showRules() {
        setRulesVisible(true)
    }

    return (
        <Container className="">
            <Col className="text-center">
                <Button variant="contained" size="large" className="mybutton" onClick={() => showRules()}>
                    RULES
                </Button>
            </Col>
        </Container>
    )
}

function Rules(props) {
    const setRulesVisible = props.setRulesVisible

    function noRules() {
        setRulesVisible(false)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <Container>
                    <Row>
                        <Col>
                        <h3>Witch Chess Rules</h3>
                        <p>Anyone totally unfamiliar with the basic rules of Chess should refer to 
                            <a href="https://en.wikipedia.org/wiki/Rules_of_chess" target="_blank"> this Wikipedia article</a> for the full rules.
                        </p>
                        <p>
                            In brief: Chess is a turn-based strategy game where your goal is to capture the enemy's King. In Witch Chess, the pieces are the following:
                        </p>
                        <ul>
                        <li>Pawns <img className="rules-piece" src={imageSources.whitePawn}/> <img className="rules-piece" src={imageSources.blackPawn}/></li>
                        <li>Knights <img className="rules-piece" src={imageSources.whiteKnight}/> <img className="rules-piece" src={imageSources.blackKnight}/></li>
                        <li>Bishops <img className="rules-piece" src={imageSources.whiteBishop}/> <img className="rules-piece" src={imageSources.blackBishop}/></li>
                        <li>Rooks <img className="rules-piece" src={imageSources.whiteRook}/> <img className="rules-piece" src={imageSources.blackRook}/></li>
                        <li>Queens <img className="rules-piece" src={imageSources.whiteQueen}/> <img className="rules-piece" src={imageSources.blackQueen}/></li>
                        <li>Kings <img className="rules-piece" src={imageSources.whiteKing}/> <img className="rules-piece" src={imageSources.blackKing}/></li>
                        </ul>
                        <p>
                            <strong>Witches are impatient!</strong> You only have three minutes for each game (gaining two seconds when you make a move), 
                            and running out of time is an instant loss! It's better to make a bad move quickly than spend too much time trying to 
                            come up with the perfect move!
                        </p>
                        <p>
                            <strong>Witches are competitive!</strong> One game isn't enough for them to crown a victor. The first witch to win three games 
                            (or the one with the most wins in five games) is considered the true winner. 
                        </p>

                        </Col>
                    </Row>
                    <Row>
                        <Col className="pt-2 text-center">
                            <Button variant="contained" size="large" className="mybutton" onClick={() => noRules()}>BACK</Button>
                        </Col>
                    </Row>
                </Container>
            </div>
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