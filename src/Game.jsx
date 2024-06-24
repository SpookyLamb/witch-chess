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
import { fetchLobbies, getWins } from "./api"

import { v4 as uuidv4 } from "uuid"

let imgUrl = "src/assets"

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

    whiteSmite: `${imgUrl}/white-smite.png`,
    blackSmite: `${imgUrl}/black-smite.png`,
    whiteTime: `${imgUrl}/white-time-stop.png`,
    blackTime: `${imgUrl}/black-time-stop.png`,
    whiteRaise: `${imgUrl}/white-raise-dead.png`,
    blackRaise: `${imgUrl}/black-raise-dead.png`,
    whiteTele: `${imgUrl}/white-telekinesis.png`,
    blackTele: `${imgUrl}/black-telekinesis.png`,
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
            setElement(<Board lobby={lobbyCode} lobbyPrivate={lobbyPrivate} setElement={setElement}/>)
        } else {
            alert("Please enter a name for your lobby!")
        }
    }

    return (
        <Container className="pb-5 pt-1">
            <h3 className="py-2 text-center text-white">Create/Join A Lobby</h3>
            <Col className="text-center text-white d-flex justify-content-center">
                
                <TextField label="Lobby Name" className="lobby-input rounded me-1" size="small" 
                variant="filled" value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/>
                
                {/* <input value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)}/> */}
                
                <Button variant="contained" size="large" className="mybutton ms-1" onClick={() => submit()}>GO</Button>
            </Col>
            <Col className="pt-2 text-center text-white d-flex justify-content-center">
                <label className="poppins-regular" htmlFor="privacy">Private?:&nbsp;&nbsp;</label>
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
            setElement(<Board lobby={lobbyCode} lobbyPrivate={false} setElement={setElement}/>)
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
                <Col className="pt-2">
                    <h3>
                        Public Lobbies
                    </h3>
                </Col>
                <Col>
                    <RefreshButton setLobbies={setLobbies} />
                </Col>

                <Col className="col-12 py-2 border poppins-regular">
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

export function Lobby(props) {
    const setElement = props.setElement
    const [rulesVisible, setRulesVisible] = useState(false)
    
    const { auth } = useContext(AuthContext)
    const [wins, setWins] = useState(0)

    useEffect(() => {
        getWins({auth, setWins})
    }, [])

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
            <h4 className="text-center text-white py-4">Your Wins: {wins}</h4>
            <LobbyInput setElement={setElement}/>
            <RulesButton setRulesVisible={setRulesVisible}/>
            <LobbyList setElement={setElement}/>
        </div>
    )
}

export function Title() {
    return (
        <>
            <h1 className="text-white text-center pt-3">
                WITCH CHESS
            </h1>
            <h5 className="text-white text-center pt-1">"Blitz Chess with magic!"</h5>
        </>
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
    const pages = {
        1: (<>
        <h3>Witch Chess Rules (1/2)</h3>
        <p>Anyone totally unfamiliar with the basic rules of Chess should refer to 
            <a href="https://en.wikipedia.org/wiki/Rules_of_chess" target="_blank"> this Wikipedia article</a> for the full rules.
        </p>
        <p>
            In brief: Chess is a turn-based strategy game where your goal is to capture the enemy's King. In Witch Chess, the pieces are the following:
        </p>
        <ul>
        <li><img className="rules-piece" src={imageSources.whitePawn}/> <img className="rules-piece" src={imageSources.blackPawn}/> &nbsp;Pawns </li>
        <li><img className="rules-piece" src={imageSources.whiteKnight}/> <img className="rules-piece" src={imageSources.blackKnight}/> &nbsp;Knights </li>
        <li><img className="rules-piece" src={imageSources.whiteBishop}/> <img className="rules-piece" src={imageSources.blackBishop}/> &nbsp;Bishops </li>
        <li><img className="rules-piece" src={imageSources.whiteRook}/> <img className="rules-piece" src={imageSources.blackRook}/> &nbsp;Rooks </li>
        <li><img className="rules-piece" src={imageSources.whiteQueen}/> <img className="rules-piece" src={imageSources.blackQueen}/> &nbsp;Queens </li>
        <li><img className="rules-piece" src={imageSources.whiteKing}/> <img className="rules-piece" src={imageSources.blackKing}/> &nbsp;Kings </li>
        </ul>
        <p>
            <strong>Witches are impatient!</strong> You only have three minutes for each game (gaining three seconds when you make a move). 
            Running out of time is an instant loss! It's better to make a bad move quickly than spend too much time trying to 
            come up with the perfect move!
        </p>
        <p>
            <strong>Witches are competitive!</strong> One game isn't enough for them to crown a victor. The first witch to win three games 
            (or the one with the most wins in five games) is considered the true winner. 
        </p>
        </>),
        2: (<>
        <h3>Witch Chess Rules (2/2)</h3>
        <p>
            <strong>Witches cast spells!</strong> Unlike normal chess, in Witch Chess, you can use once-per-game spells that can influence the board 
            and give an edge over your opponent (ideally before they do the same to you). The spells are as follows:
        </p>
        <ul>
        <li><img className="rules-piece" src={imageSources.whiteSmite}/><img className="rules-piece" src={imageSources.blackSmite}/> &nbsp; <strong>Smite</strong>
        <p>Use your turn to instantly capture an enemy piece threatened by one of your pieces, without moving a piece. Cannot target the King or Queen.</p>
        <p>TO USE: Click the spell, then click a valid piece, turning it to ash.</p>
        </li>
        <li><img className="rules-piece" src={imageSources.whiteTime}/><img className="rules-piece" src={imageSources.blackTime}/> &nbsp; <strong>Time Stop</strong>
        <p>Activate, and then skip your opponent's next turn, so long as neither King is in Check at the beginning or end of your first turn.</p>
        <p>TO USE: Click the spell, and then take your turn. Putting a King in Check cancels the spell.</p>
        </li>
        <li><img className="rules-piece" src={imageSources.whiteRaise}/><img className="rules-piece" src={imageSources.blackRaise}/> &nbsp; <strong>Raise Dead</strong>
        <p>Use your turn to return one of your captured pieces to a valid starting position (cannot be used on a piece if their position(s) is/are occupied).</p>
        <p>TO USE: Click the spell, click one of your captured pieces, and then click a valid (unoccupied) starting square.</p>
        </li>
        <li><img className="rules-piece" src={imageSources.whiteTele}/><img className="rules-piece" src={imageSources.blackTele}/> &nbsp; <strong>Telekinesis</strong>
        <p>Instead of moving one of your own pieces, use your turn to move an opponent's pawn, following normal movement rules.</p>
        <p>TO USE: Click the spell, and then move an enemy pawn.</p>
        </li>
        </ul>
        <p><strong>To cancel a spell</strong>, simply click the same spell again.</p>
        </>),
    }
    const [pageNum, setPageNum] = useState(1)

    function noRules() {
        setRulesVisible(false)
    }

    function changePage(increment) {
        if (increment) {
            if (pageNum + 1 < 3) {
                setPageNum(pageNum + 1)
            }
        } else {
            if (pageNum - 1 > 0) {
                setPageNum(pageNum - 1)
            }
        }
    }

    let pageButt
    if (pageNum === 1) {
        pageButt = (<Button variant="contained" size="large" className="mybutton mx-1" onClick={() => changePage(true)}>Next</Button>)
    } else {
        pageButt = (<Button variant="contained" size="large" className="mybutton mx-1" onClick={() => changePage(false)}>Back</Button>)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <Container>
                    <Row>
                        <Col>
                            {pages[pageNum]}
                        </Col>
                    </Row>
                    <Row>
                        <Col className="pt-2 text-center">
                            <Button variant="contained" size="large" className="mybutton mx-1" onClick={() => noRules()}>OK</Button>
                            {pageButt}
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