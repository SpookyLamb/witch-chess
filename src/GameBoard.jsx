import { useRef, useState } from "react"
import { useEffect } from "react"

import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"

import { v4 as uuidv4 } from 'uuid'

import { checkSpecialMoves, validateMove, validateWin } from "./ChessLogic"
import { createClient } from "./websocket"

//game websocket
let clientRef

//game state
let activeSquare = [0,0] //coordinates of the active square, 0 in row (NOT COLUMN) means no active square

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
}

function sendGameState(clientRef, boardState, nextTurn) {
    let client = clientRef//.current //weird useRef bullshit

    client.send(
        JSON.stringify({
            "dispatch": "gamestate",
            'message': boardState,
            'turn': nextTurn,
        })
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

    //these squares need to respond to click input and inform the board, which does the actual logical heavy lifting on if that clicks means anything
    let displayPiece

    if (piece) { //not empty string
        displayPiece = piece
    } else {
        displayPiece = ""
    }

    //determines visual placement in the grid based on the client's color
    let visRow = row
    let visCol = col

    if (clientColor === "Black") {
        //row is untouched
        visCol = invert[col + 1] //math accounts for the 1-8/0-7 funkiness
    } else { //renders white-side by default
        //col is untouched
        visRow = invert[row]
    }
    
    return (
        <div className="game-square" 
        style={{ 
            gridColumnStart: visCol,
            gridColumnEnd: visCol + 1,
            gridRowStart: visRow,
            gridRowEnd: visRow + 1,
        }}
        onClick={() => { squareClicked(row, col) }}>
        
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

    const [whiteCaptures, setWhiteCaptures] = useState([]) //black pieces captured by white
    const [blackCaptures, setBlackCaptures] = useState([]) //white pieces captured by black

    const [turn, setTurn] = useState("White")
    const [clientColor, setClientColor] = useState("Spectator")

    const lobby = props.lobby

    //websocket
    useEffect( () => {
        clientRef = createClient(lobby)

        clientRef.onmessage = (e) => {
            if (typeof e.data === 'string') {
                console.log("Received: ", e.data);

                let object = JSON.parse(e.data)

                switch (object.dispatch) {
                    case "initial": //color assignment
                        setClientColor(object.color)
                        break;
                    case "gamestate": //recieves new gamestate from the other player
                        setBoardState(object.message)
                        setTurn(object.turn)
                        break;
                    default:
                        console.error("Bad data returned by the websocket: ", e.data)
                        return
                }
            }
        };
    }, [])

    //element lists for rendering
    let boardElements = []
    let cappedWhite = []
    let cappedBlack = []

    function squareClicked(row, column) { //responds to a game square being clicked, designating that square as the "active" square, provided a piece is present

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
                console.log("Active square set!", activeSquare)
            } else { //square doesn't have a piece
                return //do nothing, empty squares can't become active
            }
        } else { //square already active, needs to check piece movement
            //if the square is identical to the current square, simply reset
            if (activeSquare[0] === row && activeSquare[1] === column) {
                activeSquare = [0,0]
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

                    //set the new state, by sending it via our socket and getting it echoed back
                    sendGameState(clientRef, newState, newTurn)

                    //finally, reset the activeSquare
                    activeSquare = [0,0]
                } else {
                    console.log("Invalid move!")
                    activeSquare = [0,0] //reset, try again
                    return //ignore the move, as it is invalid
                }
            }
            
        }
    }

    function fillBoardElements(newBoardState) { //fills out the board visuals row by row

        //by default, draws as though the player is white
        //this only affects the visuals - gameplay and calculations are identical regardless

        for (let i = 1; i <= 8; i++) { //row loop
            for (let j = 7; j >= 0; j--) { //column loop
                boardElements.push(
                    <Square
                        row={i}
                        col={j}
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
            cappedWhite.push(
                <div key={uuidv4()}>
                    {capturedPiece}
                    <br/>
                </div>
            )
        }

        for (const capturedPiece of blackCaptures) {
            cappedBlack.push(
                <div key={uuidv4()}>
                    {capturedPiece}
                    <br/>
                </div>
            )
        }

        //while we're here (and we know state has updated), go ahead and check for a victory
        let white
        if (turn === "White") { 
            white = true
        } else {
            white = false
        }

        let winner = validateWin(white, newBoardState)
        if (winner) { //empty string means no winner
            if (winner === "Draw") {
                alert("Stalemate!")
            } else {
                alert(winner + " has won the game!")

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
                setTurn("White")
            }
        }
    }

    fillBoardElements(boardState)

    let turnDisplay
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

    return (
        <Container>
            <Row>
                <Col id="black-captures" className="text-end">
                    {cappedBlack}
                </Col>
                <Col className="game-board">
                    <div className="chess-grid">
                        {boardElements}
                    </div>
                </Col>
                <Col id="white-captures" className="">
                    {cappedWhite}
                </Col>
            </Row>
            <Row>{turnDisplay}</Row>
        </Container>
    )
}

export default Board