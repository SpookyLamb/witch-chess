import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid'

import { checkSpecialMoves, validateMove, validateWin } from "./ChessLogic"

let activeSquare = [0,0] //coordinates of the active square, 0 in row (NOT COLUMN) means no active square

function Square(props) {
    //game square, an 8x8 grid of 64 of these makes up the whole game board
    //each square has a given row (numbered 1-8) and column (lettered A-H)
    //each square MIGHT also have a piece in it, tracked via boardState
    const row = props.row
    const col = props.col
    const piece = props.piece
    const squareClicked = props.squareClicked

    //these squares need to respond to click input and inform the board, which does the actual logical heavy lifting on if that clicks means anything
    let displayPiece

    if (piece) { //not empty string
        displayPiece = piece
    } else {
        displayPiece = ""
    }
    
    return (
        <Col className="game-square" onClick={() => {
            squareClicked(row, col)
        }}>
            {displayPiece}
        </Col>
    )
}

function Board() {
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

    let boardElements = []
    let cappedWhite = []
    let cappedBlack = []

    function squareClicked(row, column) { //responds to a game square being clicked, designating that square as the "active" square, provided a piece is present
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
                console.log("Active square set!")
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
                    
                    //set the new state
                    setBoardState(result[0]) //forward the current and previous board states

                    //finally, reset the activeSquare
                    activeSquare = [0,0]

                    //and flip whos turn it is
                    if (turn === "White") {
                        setTurn("Black")
                    } else {
                        setTurn("White")
                    }

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
        //TO FLIP DRAW DIRECTION (and thus which side is on the bottom on a player's screen), FLIP ORDER OF ITERATION, so increment i instead of decrementing i
        //the OPPOSITE must be done with the other iterator (j) to properly mirror the board, as though it was physically turned
        //this only affects the visuals - gameplay and calculations are identical regardless

        for (let i = 8; i >= 1; i--) { //row loop
            let rowArray = newBoardState[i]
            let rowElements = []

            for (let j = 0; j < rowArray.length; j++) { //column loop
                rowElements.push(
                    <Square
                        row={i}
                        col={j}
                        piece={newBoardState[i][j]}
                        squareClicked={squareClicked}
                        key={uuidv4()}
                    />
                )
            }

            boardElements.push(
                <Row key={uuidv4()}>
                    {rowElements}
                </Row>
            )
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

    return (
        <Container>
            <Row>
                <Col id="black-captures" className="text-end">
                    {cappedBlack}
                </Col>
                <Col>
                    <Container className="game-board">
                        {boardElements}
                        <div>{turn} to move.</div>
                    </Container>
                </Col>
                <Col id="white-captures">
                    {cappedWhite}
                </Col>
            </Row>
        </Container>
    )
}

export default Board