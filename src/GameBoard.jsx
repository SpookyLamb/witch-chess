import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid'

import { validateMove } from "./ChessLogic"

let activeSquare = [0,0] //coordinates of the active square, 0 in either means no active square

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

    let boardElements = []

    function squareClicked(row, column) { //responds to a game square being clicked, designating that square as the "active" square, provided a piece is present
        let piece = boardState[row][column]

        console.log("ROW: ", row, " COLUMN: ", column + 1, " PIECE: ", piece)

        if (activeSquare[0] === 0 || activeSquare[1] === 0) { //no currently active square
            //check the clicked square to see if it has a piece, via boardState
            if (piece) { //empty strings (aka, no piece) are false
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
                let valid = validateMove(piece, activeSquare, [row, column], boardState)
                let copyState = structuredClone(boardState) //get a mutable copy

                if (valid) {
                    //"move" the piece (place it in the new position), noting captures (the piece that was there, if it wasn't empty)
                    console.log("Valid move!")
                    let activeX = activeSquare[0]
                    let activeY = activeSquare[1]

                    //place the piece in its new position
                    let activePiece = copyState[ activeX ][ activeY ]
                    copyState[row][column] = activePiece

                    //remove the piece from its old position
                    copyState[activeX][activeY] = "" //empty string is no piece
                    
                    //set the new state
                    setBoardState(copyState)

                    //finally, reset the activeSquare
                    activeSquare = [0,0]
                } else {
                    console.log("Invalid move!")
                    return //ignore the move, as it is invalid
                }
            }
            
        }
    }

    function fillBoardElements(newBoardState) { //fills out the board visuals row by row
        //TO FLIP DRAW DIRECTION (and thus which side is on the bottom on a player's screen), FLIP ORDER OF ITERATION, so decrement i instead of incrementing i
        //the OPPOSITE must be done with the other iterator (j) to properly mirror the board

        //console.log(boardState)

        for (let i = 1; i <= 8; i++) { //row loop
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
    }

    fillBoardElements(boardState)

    return (
        <Container className="game-board">
            {boardElements}
        </Container>
    )
}

export default Board