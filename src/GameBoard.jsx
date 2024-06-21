import { useState } from "react"
import { useEffect } from "react"

import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Image from "react-bootstrap/Image"

import { Button } from "@mui/material"

import { v4 as uuidv4 } from 'uuid'

import { checkSpecialMoves, validateMove, validateWin, checkCaptures, legalMoves, validateSpell, validSpellcasts, findKing, validateCheck, pawnPositions, graveSpots } from "./ChessLogic"
import { createClient } from "./websocket"
import { formatSeconds, tick } from "./utility"

import { debug } from "./api"
import { Lobby } from "./Game"

let imgUrl = "assets"

if (debug) {
    imgUrl = "src/assets"
}

//pictures
const imageSources = {
    gameBoard: `${imgUrl}/chess-board.png`,
    hourglass: `${imgUrl}/hourglass.png`,
    
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

//game websocket
let clientRef;

//game state
let activeSquare = [0,0]; //coordinates of the active square, 0 in row (NOT COLUMN) means no active square

//inversion table
let invert = {
    1: 8,
    2: 7,
    3: 6,
    4: 5,
    5: 4,
    6: 3,
    7: 2,
    8: 1,
};

//game state
let lastState = {
    8: ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"], //these strings correspond to pieces, should be self-explanatory
    7: ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"], //empty string = no piece
    6: ["", "", "", "", "", "", "", ""],
    5: ["", "", "", "", "", "", "", ""],
    4: ["", "", "", "", "", "", "", ""],
    3: ["", "", "", "", "", "", "", ""],
    2: ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    1: ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
}; //stores the game state most recently sent to the client, starts with the default

let undeadPiece; //stores the piece code for a piece that is being RESURRECTED

let whiteTimer = 180; //stores the ACTUAL playtime left for white
let blackTimer = 180; //likewise for black

let decision = false; //tells React not to declare a winner repeatedly
let popSentinel = false; //makes React behave with the pop ups and actually queue them up >:(
let colorTracker = "Spectate"; // >:(

let whiteWinnings = 0; //REACT!!!
let blackWinnings = 0;

let enemySpells = [] //tracks enemy spells for the websocket

let queuedFunctions = []

function announceWin(winner) {
    if (decision) {
        return
    } else {
        decision = true
    }

    //sends the winner back to the server
    let client = clientRef

    client.send(
        JSON.stringify({
            "dispatch": "game-over",
            'message': winner,
            'turn': "",
        })
    )
}

function resetBoard(setBoardState, setTurn, setWhiteTime, setBlackTime, setWhiteCaptures, setBlackCaptures, setActiveSpell, setUsedSpells) {
    //reset the board
    setBoardState({
        8: ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        7: ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"], 
        6: ["", "", "", "", "", "", "", ""],
        5: ["", "", "", "", "", "", "", ""],
        4: ["", "", "", "", "", "", "", ""],
        3: ["", "", "", "", "", "", "", ""],
        2: ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
        1: ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"], })
    lastState = {
        8: ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        7: ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
        6: ["", "", "", "", "", "", "", ""],
        5: ["", "", "", "", "", "", "", ""],
        4: ["", "", "", "", "", "", "", ""],
        3: ["", "", "", "", "", "", "", ""],
        2: ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
        1: ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
    }
    setTurn("White")
    whiteTimer = 180
    blackTimer = 180

    setWhiteTime(whiteTimer)
    setBlackTime(blackTimer)

    setWhiteCaptures([])
    setBlackCaptures([])

    setActiveSpell("")
    setUsedSpells([])

    decision = false
}

function sendSpell(clientRef, spellName, color) {
    let client = clientRef

    client.send(
        JSON.stringify({
            "dispatch": "spell",
            'message': spellName,
            'turn': color,
        })
    )
}

function sendGameState(clientRef, boardState, nextTurn) {
    let client = clientRef

    client.send(
        JSON.stringify({
            "dispatch": "gamestate",
            'message': boardState,
            'turn': nextTurn,
        })
    )
}

function getImagePath(piece) {
    let imagePath
        
    switch (piece) {
        case "wP":
            imagePath = imageSources.whitePawn
            break;
        case "wPx":
            imagePath = imageSources.whitePawn
            break;
        case "wN":
            imagePath = imageSources.whiteKnight
            break;
        case "wB":
            imagePath = imageSources.whiteBishop
            break;
        case "wR":
            imagePath = imageSources.whiteRook
            break;
        case "wQ":
            imagePath = imageSources.whiteQueen
            break;
        case "wK":
            imagePath = imageSources.whiteKing
            break;
        
        case "bP":
            imagePath = imageSources.blackPawn
            break;
        case "bPx":
            imagePath = imageSources.blackPawn
            break;
        case "bN":
            imagePath = imageSources.blackKnight
            break;
        case "bB":
            imagePath = imageSources.blackBishop
            break;
        case "bR":
            imagePath = imageSources.blackRook
            break;
        case "bQ":
            imagePath = imageSources.blackQueen
            break;
        case "bK":
            imagePath = imageSources.blackKing
            break;
        default: //fail
            imagePath = piece
    }

    return imagePath
}

function WinTracker(props) {
    const blackWins = props.blackWins
    const whiteWins = props.whiteWins

    let dot1 = ""
    let dot2 = ""
    let dot3 = ""
    let dot4 = ""
    let dot5 = ""

    if (blackWins > 0) {
        dot1 = "red-dot"
        
        if (blackWins > 1) {
            dot2 = "red-dot"
        }
        if (blackWins > 2) {
            dot3 = "red-dot"
        }
    }

    if (whiteWins > 0) {
        dot5 = "blue-dot"

        if (whiteWins > 1) {
            dot4 = "blue-dot"
        }
        if (whiteWins > 2) {
            dot3 = "blue-dot"
        }
    }

    return (
        <div className="win-tracker py-1">
            <div className={"dot " + dot1}/>
            <div className={"dot " + dot2}/>
            <div className={"dot " + dot3}/>
            <div className={"dot " + dot4}/>
            <div className={"dot " + dot5}/>
        </div>
    )
}

function SpellButton(props) {
    let src = props.src
    const spell = props.spell
    const activeSpell = props.activeSpell
    const activateSpell = props.activateSpell
    const usedSpells = props.usedSpells
    const disabled = props.disabled //enemy spells are disabled

    let used = false

    function useSpell() {
        if (disabled) {
            return
        }

        if (!used) {
            activateSpell(spell)
        }
    }

    let classes = ""
    if (disabled) {
        classes = "enemy-spell"
    } else {
        classes = "spell-button"
    }

    if (usedSpells.includes(spell)) {
        src = `${imgUrl}/used-spell.png`
        used = true
    }

    if (activeSpell === spell) {
        //it's me, I'm active!
        console.log("highlight")
        classes += " spell-highlight"
    }

    return (
        <Col className={classes}>
            <Image src={src} fluid onClick={() => {useSpell()}}/>
        </Col>
    )
}

function PopUp(props) {
    let text = props.text
    const setPopVisible = props.setPopVisible

    function killPopup() {
        popSentinel = false
        setPopVisible(false)
    }

    let header
    if (text === "VICTORY") {
        header = (<h2>VICTORY!</h2>)
        text = "You won the set! Congratulations!"
    } else if (text === "DEFEAT") {
        header = (<h2>You've lost...</h2>)
        text = "You didn't take enough rounds to win the set. Better luck next time!"
    } else {
        header = (<></>)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <Container>
                    <Row>
                        <Col className="text-center">
                            {header}
                            <p>{text}</p>
                        </Col>
                    </Row>
                    <Row>
                        <Col className="text-center">
                        <Button variant="contained" size="large" className="mybutton" onClick={() => killPopup()}>OK</Button>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    )
}

function Square(props) {
    //game square, an 8x8 grid of 64 of these makes up the whole game board
    //each square has a given row (numbered 1-8) and column (lettered A-H)
    //each square MIGHT also have a piece in it, tracked via boardState
    const row = props.row
    const col = props.col
    const piece = props.piece
    const squareClicked = props.squareClicked
    const clientColor = props.clientColor
    const valid = props.valid

    //these squares need to respond to click input and inform the board, which does the actual logical heavy lifting on if that clicks means anything
    let displayPiece

    if (piece) { //not empty string
        //displayPiece = piece
        let imagePath = getImagePath(piece)
        let alt = ""

        switch (piece.charAt(1)) {
            case "P":
                alt = "Pawn"
                break;
            case "N":
                alt = "Knight"
                break;
            case "B":
                alt = "Bishop"
                break;
            case "R":
                alt = "Rook"
                break;
            case "Q":
                alt = "Queen"
                break;
            case "K":
                alt = "King"
                break;
            default:
                alt = ""
                break;
        }

        displayPiece = (
            <Image
                className="chess-piece"
                alt={alt}
                src={imagePath}
                fluid
            />
        )

    } else {
        //displayPiece = ""
        displayPiece = (<></>)
    }

    //determines visual placement in the grid based on the client's color
    let visRow = row
    let visCol = col

    if (clientColor === "Black") {
        //row is untouched
        visCol = invert[col + 1] //math accounts for the 1-8/0-7 funkiness
    } else { //renders white-side by default
        visCol = col + 1
        visRow = invert[row]
    }

    let colorClass
    //finally, calculate whether or not this particular square should be a white or black square, or a "valid" square
    if (valid) {
        colorClass = "valid-square"
    } else if (row % 2 === 0) { //even row
        if ((col + 1) % 2 === 0) { //even row, even col = black
            colorClass = "black-square"
        } else { //even row, odd col = white
            colorClass = "white-square"
        }
    } else { //odd row
        if ((col + 1) % 2 === 0) { //odd row, even col = white
            colorClass = "white-square"
        } else { //odd row, odd col = black
            colorClass = "black-square"
        }
    }
    
    return (
        <div className={"game-square" + " " + colorClass}
            style={{ 
                gridColumnStart: visCol,
                gridColumnEnd: visCol + 1,
                gridRowStart: visRow,
                gridRowEnd: visRow + 1,
            }}
            onClick={() => { squareClicked(row, col) }}
        >
            {displayPiece}
        </div>
    )
}

function Board(props) {
    //game board consists of eight rows (numbered 1-8) and eight columns (lettered A-H)
    const [boardState, setBoardState] = useState({
        8: ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"], //these strings correspond to pieces, should be self-explanatory
        7: ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"], //empty string = no piece
        6: ["", "", "", "", "", "", "", ""],
        5: ["", "", "", "", "", "", "", ""],
        4: ["", "", "", "", "", "", "", ""],
        3: ["", "", "", "", "", "", "", ""],
        2: ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
        1: ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
        // in this visual, the columns are:
        // A, B, C, D, E, F, G, H
    })

    const [canPlay, setCanPlay] = useState(false) //only becomes true when both players are present, set by the socket

    const [whiteCaptures, setWhiteCaptures] = useState([]) //black pieces captured by white
    const [blackCaptures, setBlackCaptures] = useState([]) //white pieces captured by black

    const [whiteTime, setWhiteTime] = useState(180) //remaining clock time, in seconds
    const [blackTime, setBlackTime] = useState(180) //these times are PURELY VISUAL and not the actual time being tracked, because React :/

    const [turn, setTurn] = useState("White")
    const [clientColor, setClientColor] = useState("None")

    const [validMoves, setValidMoves] = useState([])

    const [whiteWins, setWhiteWins] = useState(0)
    const [blackWins, setBlackWins] = useState(0)

    //spells
    const [activeSpell, setActiveSpell] = useState("")
    const [usedSpells, setUsedSpells] = useState([])
    const [enemyUsedSpells, setEnemyUsedSpells] = useState([])

    //pop ups
    const [popVisible, setPopVisible] = useState(false)
    const [popText, setPopText] = useState("")
    const [queuedPopText, setQueuedPopText] = useState("")

    //lobby props
    const lobby = props.lobby
    const lobbyPrivate = props.lobbyPrivate
    const setElement = props.setElement

    //websocket
    useEffect( () => {
        clientRef = createClient(lobby, lobbyPrivate)

        clientRef.onmessage = (e) => {
            if (typeof e.data === 'string') {
                console.log("Received: ", e.data);

                let object = JSON.parse(e.data)

                switch (object.dispatch) {
                    case "initial": //color assignment
                        setClientColor(object.color)
                        colorTracker = object.color
                        break;
                    case "gamestate": //recieves new gamestate from the other player

                        if (!object.message) {
                            //ignores bad game states, like null or empty strings
                            return
                        }

                        //check for captures
                        const cap = checkCaptures(object.message, lastState)
                        
                        if (cap) {
                            if (cap.startsWith("w")) { //white piece captured by black
                                let captures = blackCaptures
                                captures.push(cap)
                                setBlackCaptures(captures)
                            } else { //black piece captured by white
                                let captures = whiteCaptures
                                captures.push(cap)
                                setWhiteCaptures(captures)
                            }
                        }

                        //update state
                        lastState = object.message
                        setBoardState(object.message)
                        setTurn(object.turn)
                        
                        break;
                    case "gamestart": //informs players that the game can start
                        setCanPlay(object.message)

                        clientRef.send( //echo back to let the server know the message was recieved
                            JSON.stringify({
                                "dispatch": "echo-gamestart",
                                'message': "",
                                'turn': "",
                            })
                        )

                        doPopUp("Let the game begin!")
                        break;
                    case "disconnect": //tells the remaining players that a player has disconnected
                        if (object.message !== "Spectate") { //we don't care when spectators leave
                            if (object.message !== clientColor) {
                                doPopUp("Your opponent has left the game!")
                                queuedFunctions.push(returnToLobby)
                            }
                        }
                        break;
                    case "time": //informs the player about an update to one player's remaining time
                        if (object.color === "White") {
                            whiteTimer = object.new_time
                            setWhiteTime(whiteTimer)
                        } else if (object.color === "Black") {
                            blackTimer = object.new_time
                            setBlackTime(blackTimer)
                        }
                        break;
                    case "timeout": //informs the players that a player has timed out, winning the game for the other player automatically
                        if (object.color === "White") {
                            blackWinnings += 1
                            setBlackWins(blackWinnings)
                            announceWin("Black")
                            doPopUp("Time OUT for White! Black has won the game!")
                        } else if (object.color === "Black") {
                            whiteWinnings += 1
                            setWhiteWins(whiteWinnings)
                            announceWin("White")
                            doPopUp("Time OUT for Black! White has won the game!")
                        }
                        break;
                    case "next-round":
                        //reset and begin a new round
                        resetBoard(setBoardState, setTurn, setWhiteTime, setBlackTime, setWhiteCaptures, setBlackCaptures, setActiveSpell, setUsedSpells)
                        doPopUp("The true victor is still undecided. Another round!")

                        clientRef.send( //echo back to let the server know the message was recieved
                            JSON.stringify({
                                "dispatch": "echo-nextround",
                                'message': "",
                                'turn': "",
                            })
                        )

                        break;
                    case "victory":
                        if (object.color === colorTracker) {
                            doPopUp("VICTORY")
                            queuedFunctions.push(returnToLobby)
                        } else { //also happens when a total draw occurs
                            doPopUp("DEFEAT")
                            queuedFunctions.push(returnToLobby)
                        }
                        
                        break;
                    case "spell":
                        if (object.color !== colorTracker) {
                            enemySpells.push(object.spell)
                            setEnemyUsedSpells(enemySpells)
                        }
                        break;
                    default:
                        console.error("Bad data returned by the websocket: ", e.data)
                        return
                }
            }
        };
    }, [])

    function returnToLobby() { //boots the player back to the lobby screen
        clientRef.close(1000)
        setElement(<Lobby setElement={setElement}/>)
    }

    //SPELLS

    function activateSpell(spell) {
        if (!canPlay) {
            return
        }

        if (turn !== clientColor) {
            return //player can only move on their own turn
        }

        if (spell === activeSpell) { //double click, cancel
            setActiveSpell("")
            setValidMoves([])
            return
        }

        if (spell === "time-stop") {
            //make sure neither king is in check
            let whiteKing = findKing(true, boardState)
            let blackKing = findKing(false, boardState)

            let whiteInCheck = validateCheck(true, whiteKing[0], whiteKing[1], boardState)
            let blackInCheck = validateCheck(false, blackKing[0], blackKing[1], boardState)

            if (whiteInCheck || blackInCheck) {
                doPopUp("You can't stop time while a king is in check!")
                return
            } //otherwise, proceed
        }

        //deactivate active square when changing spells
        activeSquare = [0,0]
        setValidMoves([])

        console.log("spell", spell)
        setActiveSpell(spell)
    }

    function capPieceClicked(piece) {

        if (activeSpell === "raise-dead") {
            if (piece.startsWith("w") && clientColor === "White") {
                // if (piece === "wPx") {
                //     piece = "wP"
                // }
                undeadPiece = piece
                setValidMoves(graveSpots(true, piece, boardState))
            } else if (piece.startsWith("b") && clientColor === "Black") {
                // if (piece === "bPx") {
                //     piece = "bP"
                // }
                undeadPiece = piece
                setValidMoves(graveSpots(false, piece, boardState))
            }
        }

        // console.log("cappiece", piece)
    }

    if (activeSpell) {

        let white
        if (clientColor === "White") {
            white = true
        } else if (clientColor === "Black") {
            white = false
        }

        switch (activeSpell) {
            case "smite":
                if (validMoves.length < 1) { //haven't already validated moves
                    let casts = validSpellcasts(activeSpell, white, boardState)
                    
                    if (casts.length > 0) { //valid moves available
                        setValidMoves(casts)
                    }
                }
                break;
            case "time-stop":
                //no special visuals for time stop
                break;
            case "telekinesis":
                //highlight the enemy pawns during telekinesis
                if (validMoves.length < 1) {
                    let pawns = pawnPositions(!white, boardState)

                    if (pawns.length > 0) {
                        setValidMoves(pawns)
                    }
                }

                break;
            case "raise-dead":
                //raise dead's visuals are filled above
                break;
            default:
                //something weird has happened
                setActiveSpell("")
                break;
        }

    }

    function doPopUp(text) {
        //queue
        if (popSentinel) { //don't override existing pop up, wait until it dies
            setQueuedPopText(text)
        } else {
            setPopText(text)
            popSentinel = true
            setPopVisible(true)
        }
    }

    let popUp
    if (popVisible) {
        popUp = (<PopUp text={popText} setPopVisible={setPopVisible}/>)
    } else if (queuedPopText) {
        doPopUp(queuedPopText)
        setQueuedPopText("")
    } else if (queuedFunctions.length > 0) {
        const func = queuedFunctions.pop()
        func()
    } else {
        popUp = (<></>)
    }

    //element lists for rendering
    let boardElements = []
    let cappedWhite = []
    let cappedBlack = []

    function squareClicked(row, column) { //responds to a game square being clicked, designating that square as the "active" square, provided a piece is present

        if (!canPlay) {
            return //can't play until both players are present
        }

        if (turn !== clientColor) {
            return //player can only move on their own turn
        }

        if (activeSpell) {
            //currently active spell

            let white
            if (clientColor === "White") {
                white = true
            } else if (clientColor === "Black") {
                white = false
            } else { //spectator shouldn't get here
                return
            }

            let valid
            switch (activeSpell) {
                case "smite":
                    valid = validateSpell(activeSpell, white, [row, column], boardState)

                    if (valid) {
                        //SMITE THAT PIECE

                        let newState = structuredClone(boardState)
                        newState[row][column] = ""

                        let newTurn 
                        if (turn === "White") {
                            newTurn = "Black"
                        } else {
                            newTurn = "White"
                        }

                        //set the new state, by sending it via our socket and getting it echoed back
                        sendGameState(clientRef, newState, newTurn)

                        //finally, reset the activeSquare and the spell
                        let newUsed = Array.from(usedSpells)
                        newUsed.push("smite")
                        setUsedSpells(newUsed)
                        sendSpell(clientRef, "smite", colorTracker)

                        activeSquare = [0,0]
                        setValidMoves([])
                        setActiveSpell("")

                        return
                    } else { //deactivate spell, otherwise let the function play out like normal
                        activeSquare = [0,0]
                        setValidMoves([])
                        setActiveSpell("")
                    }

                    break;
                case "telekinesis":
                    let piece = boardState[row][column]

                    if (activeSquare[0] === 0) { //no currently active square if row is 0
                        if (piece) { //empty strings (aka, no piece) are false
                            if (turn === "White" && !piece.startsWith("bP")) {
                                return //White can only move black pawns with telekinesis active
                            } else if (turn === "Black" && !piece.startsWith("wP")) {
                                return //Black can only move white pawns with telekinesis active
                            }
                        }

                        activeSquare = [row, column] //set the active square        
                        setValidMoves(legalMoves(piece, [row, column], boardState)) //grab the legal moves
                        return
                    }

                    break;
                case "raise-dead":
                    valid = validateSpell("raise-dead", white, [undeadPiece, [row, column]], boardState)
                    
                    if (valid) {
                        //WISE FWOM YOUW GWAVE
                        let revived = undeadPiece
                        if (revived === "wPx") {
                            revived = "wP"
                        } else if (revived === "bPx") {
                            revived = "bP"
                        }

                        let newState = structuredClone(boardState)
                        newState[row][column] = undeadPiece
                        

                        let newTurn 
                        if (turn === "White") {
                            newTurn = "Black"
                        } else {
                            newTurn = "White"
                        }

                        //remove from captured pieces
                        let copy
                        if (clientColor === "White") {
                            copy = Array.from(blackCaptures)
                            copy.splice(copy.indexOf(undeadPiece), 1)
                            setBlackCaptures(copy)
                        } else {
                            copy = Array.from(whiteCaptures)
                            copy.splice(copy.indexOf(undeadPiece), 1)
                            setWhiteCaptures(copy)
                        }

                        //set the new state, by sending it via our socket and getting it echoed back
                        sendGameState(clientRef, newState, newTurn)

                        //finally, reset the activeSquare and the spell
                        let newUsed = Array.from(usedSpells)
                        newUsed.push("raise-dead")
                        setUsedSpells(newUsed)
                        sendSpell(clientRef, "raise-dead", colorTracker)

                        undeadPiece = ""
                        activeSquare = [0,0]
                        setValidMoves([])
                        setActiveSpell("")

                        return
                    } else { //deactivate spell, otherwise let it play out like normal
                        activeSquare = [0,0]
                        setValidMoves([])
                        setActiveSpell("")
                    }

                    break;
                default:
                    //ignore
                    //time stop is handled AFTER a move is made
                    break;
            }
        }

        let piece = boardState[row][column]

        //console.log("ROW: ", row, " COLUMN: ", column + 1, " PIECE: ", piece)

        if (activeSquare[0] === 0) { //no currently active square if row is 0

            //check the clicked square to see if it has a piece, via boardState
            if (piece) { //empty strings (aka, no piece) are false
                //check to make sure the piece matches the player currently moving
                if (turn === "White") {
                    if (!piece.startsWith("w")) {
                        return //can't move a black piece on white's turn
                    }
                } else {
                    if (!piece.startsWith("b")) {
                        return //can't move a white piece on black's turn
                    }
                }
                activeSquare = [row, column] //set the active square
                
                setValidMoves(legalMoves(piece, [row, column], boardState)) //grab the legal moves

                console.log("Active square set!", activeSquare)
            
            } else { //square doesn't have a piece
                setValidMoves([])
                return //do nothing, empty squares can't become active
            }
        } else { //square already active, needs to check piece movement
            //if the square is identical to the current square, simply reset
            if (activeSquare[0] === row && activeSquare[1] === column) {
                activeSquare = [0,0]
                setValidMoves([])
                console.log("Active square reset!")
            } else { //new square, check if it has a valid move
                
                let copyState = structuredClone(boardState) //get a mutable copy
                let activeX = activeSquare[0]
                let activeY = activeSquare[1]
                let activePiece = copyState[ activeX ][ activeY ]

                let valid = validateMove(activePiece, activeSquare, [row, column], boardState)

                if (valid) {
                    //"move" the piece (place it in the new position), noting captures (the piece that was there, if it wasn't empty)
                    console.log("Valid move!")

                    //handle captures
                    let capturedPiece = copyState[row][column] //note the piece that was previously in that spot
                    
                    let captures
                    if (turn === "White") {
                        captures = Array.from(whiteCaptures)
                    } else {
                        captures = Array.from(blackCaptures)
                    }

                    if (capturedPiece) { //piece captured
                        if (turn === "White") {
                            if (capturedPiece !== "wR") {
                                captures.push(capturedPiece)
                                setWhiteCaptures(captures)
                            }
                        } else {
                            if (capturedPiece !== "bR") {
                                captures.push(capturedPiece)
                                setBlackCaptures(captures)
                            }
                        }
                    }

                    //place the piece in its new position
                    copyState[row][column] = activePiece

                    //remove the piece from its old position
                    copyState[activeX][activeY] = "" //empty string is no piece
                    
                    //check for special moves
                    let result = checkSpecialMoves(copyState, boardState) //returns a two element array with the new board state and any flanked pawns
                    let newState = result[0]
                    let flank = result[1]

                    //handle flanked pieces from en passant
                    if (flank) {
                        if (turn === "White") {
                            captures.push(flank)
                            setWhiteCaptures(captures)
                        } else {
                            captures.push(flank)
                            setBlackCaptures(captures)
                        }
                    }

                    let newTurn 
                    if (turn === "White") {
                        newTurn = "Black"
                    } else {
                        newTurn = "White"
                    }

                    //ZA WARUDO - handle time stop
                    if (activeSpell === "time-stop") {
                        let whiteKing = findKing(true, boardState)
                        let blackKing = findKing(false, boardState)
    
                        let whiteInCheck = validateCheck(true, whiteKing[0], whiteKing[1], boardState)
                        let blackInCheck = validateCheck(false, blackKing[0], blackKing[1], boardState)
    
                        if (whiteInCheck || blackInCheck) {
                            //let the move go through, but chide the player
                            doPopUp("You can't stop time while a king is in check!")
                        } else {
                            newTurn = turn + "TS" //take another turn :)
                            //TS tells the backend that timestop was used

                            let newUsed = Array.from(usedSpells) //...and kill time stop
                            newUsed.push("time-stop")
                            setUsedSpells(newUsed)
                            setActiveSpell("")
                            sendSpell(clientRef, "time-stop", colorTracker)
                        }
                    }

                    if (activeSpell === "telekinesis") { //kill telekinesis
                        let newUsed = Array.from(usedSpells)
                        newUsed.push("telekinesis")
                        setUsedSpells(newUsed)
                        setActiveSpell("")
                        sendSpell(clientRef, "telekinesis", colorTracker)
                    }

                    //set the new state, by sending it via our socket and getting it echoed back
                    sendGameState(clientRef, newState, newTurn)

                    //finally, reset the activeSquare
                    activeSquare = [0,0]
                    setValidMoves([])
                } else {
                    console.log("Invalid move!")
                    activeSquare = [0,0] //reset, try again
                    setValidMoves([])
                    return //ignore the move, as it is invalid
                }
            }
            
        }
    }

    function fillBoardElements(newBoardState) { //fills out the board visuals row by row

        //by default, draws as though the player is white
        //this only affects the visuals - gameplay and calculations are identical regardless

        //console.log(validMoves)

        for (let i = 1; i <= 8; i++) { //row loop
            for (let j = 7; j >= 0; j--) { //column loop

                let valid = false
                for (const move of validMoves) {
                    if (i === move[0] && j === move[1]) {
                        valid = true
                    } 
                }

                boardElements.push(
                    <Square
                        row={i}
                        col={j}
                        valid={valid}
                        piece={newBoardState[i][j]}
                        squareClicked={squareClicked}
                        clientColor={clientColor}
                        key={uuidv4()}
                    />
                )
            }
        }

        const capClasses = "px-0"

        //fill our captures while we're at it
        for (const capturedPiece of whiteCaptures) {
            let imagePath = getImagePath(capturedPiece)

            cappedWhite.push(
                <Col className={capClasses} key={uuidv4()} onClick={() => {capPieceClicked(capturedPiece)}}>
                    <img 
                        className="capped-piece"
                        src={imagePath}
                    />
                    <br/>
                </Col>
            )
        }

        for (const capturedPiece of blackCaptures) {
            let imagePath = getImagePath(capturedPiece)

            cappedBlack.push(
                <Col className={capClasses} key={uuidv4()} onClick={() => {capPieceClicked(capturedPiece)}}>
                    <img
                        className="capped-piece"
                        src={imagePath}
                    />
                    <br/>
                </Col>
            )
        }

        //while we're here (and we know state has updated), go ahead and check for a victory
        if (!decision) {
            let white
            if (turn === "White") { 
                white = true
            } else {
                white = false
            }

            let winner = validateWin(white, newBoardState)
            if (winner) { //empty string means no winner
                if (winner === "Draw") {
                    announceWin("Draw")
                    doPopUp("Stalemate!")
                } else {
                    if (winner === "White") {
                        whiteWinnings += 1
                        setWhiteWins(whiteWinnings)
                    } else {
                        blackWinnings += 1
                        setBlackWins(blackWinnings)
                    }

                    announceWin(winner)
                    doPopUp(winner + " has won the game!")
                }
            }
        }
    }

    fillBoardElements(boardState)

    let turnDisplay
    if (canPlay) {
        if (clientColor === "White") {
            if (turn === "Black") {
                turnDisplay = (<div>Waiting on opponent...</div>)
            } else {
                turnDisplay = (<div>Your turn.</div>)
            }
        } else if (clientColor === "Black") {
            if (turn === "White") {
                turnDisplay = (<div>Waiting on opponent...</div>)
            } else {
                turnDisplay = (<div>Your turn.</div>)
            }
        }
    } else if (clientColor === "Spectate") {
        turnDisplay = "Spectating..."
    } else {
        turnDisplay = "Waiting for another player to join..."
    }

    let topTime
    let bottomTime

    if (clientColor === "Black") {
        topTime = formatSeconds(whiteTime)
        bottomTime = formatSeconds(blackTime)
    } else {
        topTime = formatSeconds(blackTime)
        bottomTime = formatSeconds(whiteTime)
    }

    let spellColor //for file paths
    let enemySpellColor
    if (clientColor === "Black") {
        spellColor = "black"
        enemySpellColor = "white"
    } else {
        spellColor = "white"
        enemySpellColor = "black"
    }

    return (
        <div>
            {popUp}
            <Container>
                <Row className="d-flex justify-content-center">
                    <WinTracker whiteWins={whiteWins} blackWins={blackWins} />
                </Row>
                <Row className="d-flex justify-content-center py-1">
                    <SpellButton src={`${imgUrl}/${enemySpellColor}-smite.png`} spell="smite" usedSpells={enemyUsedSpells} disabled={true}/>
                    <SpellButton src={`${imgUrl}/${enemySpellColor}-time-stop.png`} spell="time-stop" usedSpells={enemyUsedSpells} disabled={true}/>
                    <SpellButton src={`${imgUrl}/${enemySpellColor}-raise-dead.png`} spell="raise-dead" usedSpells={enemyUsedSpells} disabled={true}/>
                    <SpellButton src={`${imgUrl}/${enemySpellColor}-telekinesis.png`} spell="telekinesis" usedSpells={enemyUsedSpells} disabled={true}/>
                </Row>
                <Row>
                    <Col id="black-captures" className="pb-2">
                        <Row className="d-flex justify-content-center text-center">
                            <Col className="col-2 col-lg-12 px-0 align-self-start">
                                <div className="timer mx-auto">
                                    <div className="time-text text-center d-flex justify-content-center">
                                        {formatSeconds(blackTime)}
                                    </div>
                                </div>
                            </Col>
                            <Col className="col-10 col-lg-12 captures-col">
                                <Row>
                                    {cappedBlack}
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    <Col className="game-board d-flex justify-content-center align-items-center px-0">
                        <div className="chess-board-background">
                            <div className="chess-grid">
                                {boardElements}
                            </div>
                        </div>
                    </Col>
                    <Col id="white-captures" className="pb-2">
                        <Row className="d-flex justify-content-center text-center flex-row-reverse">
                            <Col className="col-2 col-lg-12 px-0 align-self-start">
                                <div className="timer mx-auto">
                                    <div className="time-text text-center d-flex justify-content-center">
                                        {formatSeconds(whiteTime)}
                                    </div>
                                </div>
                            </Col>
                            <Col className="col-10 col-lg-12 captures-col">
                                <Row>
                                    {cappedWhite}
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className="d-flex justify-content-center py-1">
                    <SpellButton src={`${imgUrl}/${spellColor}-smite.png`} spell="smite" 
                    activeSpell={activeSpell} activateSpell={activateSpell} usedSpells={usedSpells} disabled={false}/>
                    <SpellButton src={`${imgUrl}/${spellColor}-time-stop.png`} spell="time-stop" 
                    activeSpell={activeSpell} activateSpell={activateSpell} usedSpells={usedSpells} disabled={false}/>
                    <SpellButton src={`${imgUrl}/${spellColor}-raise-dead.png`} spell="raise-dead" 
                    activeSpell={activeSpell} activateSpell={activateSpell} usedSpells={usedSpells} disabled={false}/>
                    <SpellButton src={`${imgUrl}/${spellColor}-telekinesis.png`} spell="telekinesis" 
                    activeSpell={activeSpell} activateSpell={activateSpell} usedSpells={usedSpells} disabled={false}/>
                </Row>
                <Row><Col className="text-center pt-2 text-white poppins-light">{turnDisplay}</Col></Row>
            </Container>
        </div>
    )
}

export default Board