import { useState } from "react"
import { useEffect } from "react"

import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Image from "react-bootstrap/Image"

import { Button } from "@mui/material"

import { v4 as uuidv4 } from 'uuid'

import { checkSpecialMoves, validateMove, validateWin, checkCaptures, legalMoves } from "./ChessLogic"
import { createClient } from "./websocket"
import { formatSeconds, tick } from "./utility"

import { debug } from "./api"

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

let whiteTimer = 180; //stores the ACTUAL playtime left for white
let blackTimer = 180; //likewise for black

let decision = false; //tells React not to declare a winner repeatedly
let popSentinel = false; //makes React behave with the pop ups and actually queue them up >:(
let colorTracker = "Spectate"; // >:(

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

function resetBoard(setBoardState, setTurn, setWhiteTime, setBlackTime, setWhiteCaptures, setBlackCaptures) {
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

    decision = false
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
    const [clientColor, setClientColor] = useState("Spectator")

    const [validMoves, setValidMoves] = useState([])

    //pop ups
    const [popVisible, setPopVisible] = useState(false)
    const [popText, setPopText] = useState("")
    const [queuedPopText, setQueuedPopText] = useState("")

    const lobby = props.lobby
    const lobbyPrivate = props.lobbyPrivate

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
                            announceWin("Black")
                            doPopUp("Time OUT for White! Black has won the game!")
                        } else if (object.color === "Black") {
                            announceWin("White")
                            doPopUp("Time OUT for Black! White has won the game!")
                        }
                        break;
                    case "next-round":
                        //reset and begin a new round
                        resetBoard(setBoardState, setTurn, setWhiteTime, setBlackTime, setWhiteCaptures, setBlackCaptures)
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
                        } else { //also happens when a total draw occurs
                            doPopUp("DEFEAT")
                        }
                        
                        break;
                    default:
                        console.error("Bad data returned by the websocket: ", e.data)
                        return
                }
            }
        };
    }, [])

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
                    setValidMoves([])

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

                    //set the new state, by sending it via our socket and getting it echoed back
                    sendGameState(clientRef, newState, newTurn)

                    //finally, reset the activeSquare
                    activeSquare = [0,0]
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

        //fill our captures while we're at it
        for (const capturedPiece of whiteCaptures) {
            let imagePath = getImagePath(capturedPiece)

            cappedWhite.push(
                <div key={uuidv4()}>
                    <img 
                        className="capped-piece"
                        src={imagePath}
                    />
                    <br/>
                </div>
            )
        }

        for (const capturedPiece of blackCaptures) {
            let imagePath = getImagePath(capturedPiece)

            cappedBlack.push(
                <div key={uuidv4()}>
                    <img
                        className="capped-piece"
                        src={imagePath}
                    />
                    <br/>
                </div>
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
        } else { //spectator
            turnDisplay = (<div>{turn} to move.</div>)
        }
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

    return (
        <div>
            {popUp}
            <Container>
                <Row>
                    <Col>
                    </Col>
                </Row>
                <Row>
                    <Col id="black-captures" className="text-end">
                        <div className="timer mx-auto">
                            <div className="time-text">
                                {formatSeconds(blackTime)}
                            </div>
                        </div>
                        {cappedBlack}
                    </Col>
                    <Col className="game-board">
                        <div className="chess-board-background">
                            <div className="chess-grid">
                                {boardElements}
                            </div>
                        </div>
                    </Col>
                    <Col id="white-captures" className="">
                        <div className="timer mx-auto">
                            <div className="time-text">
                                {formatSeconds(whiteTime)}
                            </div>
                        </div>
                        {cappedWhite}
                    </Col>
                </Row>
                <Row><Col className="text-center pb-2 text-white">{turnDisplay}</Col></Row>
                <Row>
                    <Col className="text-center">
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Board