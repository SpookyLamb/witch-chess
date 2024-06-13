
function findKing(white, boardState) {
    //finds a given king's position

    let kingToFind

    if (white) {
        kingToFind = "wK"
    } else {
        kingToFind = "bK"
    }

    for (let i = 1; i <= 8; i++) {
        for (let j = 0; j <= 7; j++) {
            let piece = boardState[i][j]

            if (piece === kingToFind) {
                return [i, j]
            }
        }
    }

}

function checkBlockers(startPosition, endPosition, boardState) {
    //function (dumbly) takes the start and ending positions and checks if there are blockers in the way
    //doesn't consider if the movement is valid for the piece, it assumes that has already been checked
    //returns true if the piece is blocked, false if it's free to move

    const startRow = startPosition[0]
    const startCol = startPosition[1]

    const endRow = endPosition[0]
    const endCol = endPosition[1]

    let incrementRow = false
    let incrementCol = false

    let decrementRow = false
    let decrementCol = false

    if (startRow < endRow) {
        incrementRow = true
    } else if (startRow > endRow) {
        decrementRow = true
    }

    if (startCol < endCol) {
        incrementCol = true
    } else if (startCol > endCol) {
        decrementCol = true
    }

    let piece = ""

    function checkBlocked(row, col) {
        piece = boardState[row][col]

        if (piece) {
            return true //blocked
        } else {
            return false //not blocked, yet
        }
    }

    //the above booleans determine which for loops we use
    //terminating any of these loops without returning true means the piece isn't blocked, so return false
    
    //diagonals
    let j = 0

    if (incrementRow && incrementCol) { //diagonal, up and right
        j = startCol + 1
        for (let i = startRow + 1; i < endRow; i++) {
            if (checkBlocked(i, j)) {
                return true
            }
            j++
        }
        return false
    } else if (incrementRow && decrementCol) { //diagonal, up and left
        j = startCol - 1
        for (let i = startRow + 1; i < endRow; i++) {
            if (checkBlocked(i, j)) {
                return true
            }
            j--
        }
        return false
    } else if (decrementRow && incrementCol) { //diagonal, down and right
        j = startCol + 1
        for (let i = startRow - 1; i > endRow; i--) {
            if (checkBlocked(i, j)) {
                return true
            }
            j++
        }
        return false
    } else if (decrementRow && decrementCol) { //diagonal, down and left
        j = startCol - 1
        for (let i = startRow - 1; i > endRow; i--) {
            if (checkBlocked(i, j)) {
                return true
            }
            j--
        }
        return false
    }

    //orthogonals
    else if (incrementRow) { //up
        for (let i = startRow + 1; i < endRow; i++) {
            if (checkBlocked(i, startCol)) {
                return true
            }
        }
        return false
    } else if (decrementRow) { //down
        for (let i = startRow - 1; i > endRow; i--) {
            if (checkBlocked(i, startCol)) {
                return true
            }
        }
        return false
    } else if (incrementCol) { //right
        for (let i = startCol + 1; i < endCol; i++) {
            if (checkBlocked(startRow, i)) {
                return true
            }
        }
        return false
    } else if (decrementCol) { //left
        for (let i = startCol - 1; i > endCol; i--) {
            if (checkBlocked(startRow, i)) {
                return true
            }
        }
        return false
    }

    else { //this will only fire if the piece is in-place, it should NEVER fire
        console.error("Nonsense data sent to checkBlockers.")
        return true //we count this as blocked
    }
}

export function checkSpecialMoves(boardState, prevState) {
    //"boardState" is a mutable copy, "prevState" is read-only

    let flankResult = checkFlank(boardState) //checks if en passant has been executed, notes the captured pawn
    boardState = flankResult[0]
    let flank = flankResult[1]

    boardState = checkPromotion(boardState) //checks for pawn promotion
    boardState = checkPassant(boardState, prevState) //marks pawns vulnerable to en passant
    boardState = checkCastle(boardState, prevState) //checks for castles

    return [boardState, flank]
}

function checkCastle(boardState, prevState) {
    //checks if a castle has occurred and adjusts the position of the king and rook accordingly
    //a castle has occurred if:
        //a king is (virtually) in a rook's starting position (the corners of the board)
        //the king was (previously) in his starting position
    //if both are true, we can adjust the board, otherwise we leave it as-is

    let whiteKing = findKing(true, boardState)
    let prevWhiteKing = findKing(true, prevState)

    if (prevWhiteKing[0] === 1 && prevWhiteKing[1] === 4) { //previous king in correct spot
        if (whiteKing[0] === 1 && whiteKing[1] === 0 || whiteKing[1] === 7) { //current king in correct spot
            if (whiteKing[1] === 0) { //queenside
                boardState[1][2] = "wK"
                boardState[1][3] = "wR"
                boardState[1][0] = ""
            } else { //kingside
                boardState[1][6] = "wK"
                boardState[1][5] = "wR"
                boardState[1][7] = ""
            }
        }
    }

    let blackKing = findKing(false, boardState)
    let prevBlackKing = findKing(false, prevState)

    if (prevBlackKing[0] === 8 && prevBlackKing[1] === 4) { //previous king in correct spot
        if (blackKing[0] === 8 && blackKing[1] === 0 || blackKing[1] === 7) { //current king in correct spot
            if (blackKing[1] === 0) { //queenside
                boardState[8][2] = "bK"
                boardState[8][3] = "bR"
                boardState[8][0] = ""
            } else { //kingside
                boardState[8][6] = "bK"
                boardState[8][5] = "bR"
                boardState[8][7] = ""
            }
        }
    }

    return boardState
}

function checkFlank(boardState) {
    //needs to check rows 4 (for white pawns) and 5 (for black pawns) with Xs (vulnerable to en passant)
    //if any are found, needs to check rows 3 (for black pawns capturing white pawns) and 6 (for white pawns capturing black pawns)
    let flank = ""
    
    for (let i = 0; i <= 7; i++) { //white pawns
        let piece = boardState[4][i]

        if (piece === "wPx") {
            let capPiece = boardState[3][i]
            if (capPiece === "bP") {
                //edit the board state for the capture and return
                boardState[4][i] = ""
                flank = "wP"
                return [boardState, flank]
            }
        }
    }

    for (let i = 0; i <= 7; i++) { //black pawns
        let piece = boardState[5][i]

        if (piece === "bPx") {
            let capPiece = boardState[6][i]
            if (capPiece === "wP") {
                //edit the board state for the capture and return
                boardState[5][i] = ""
                flank = "bP"
                return [boardState, flank]
            }
        }
    }

    return [boardState, flank]
}

function checkPromotion(boardState) {
    //checks if any pawns have been promoted
    //we lazily convert these to queens without a choice - underpromotion isn't permitted in WITCH CHESS

    let copyState = structuredClone(boardState)

    //needs to check row 8 for white pawns and row 1 for black pawns
    let whiteRow = copyState[1]
    let blackRow = copyState[8]

    for (let i = 0; i < whiteRow.length; i++) { //black pawns are promoted here
        const piece = whiteRow[i]

        if (piece === "bP") {
            whiteRow[i] = "bQ"
            copyState[1] = whiteRow
            break; //can't promote more than one piece per turn
        }
    }

    for (let i = 0; i < blackRow.length; i++) { //white pawns are promoted here
        const piece = blackRow[i]

        if (piece === "wP") {
            blackRow[i] = "wQ"
            copyState[8] = blackRow
            break; //can't promote more than one piece per turn
        }
    }

    return copyState
}

function checkPassant(curState, prevState) {
    //recieves the previous and (a copy of) the current board state
    //can edit (and return) the copy/current state, previous state is read-only

    //checks to see if a pawn has recently moved forward two tiles
    //if so, an "x" is added to that pawn's Piece Code (this is done second)
    //also checks if any pawn that has an X has survived the prior turn, removing the X (this is done first)
    //pawns with Xs are treated differently by validate move for the special move En Passant

    //iterate across the whole board, grabbing any pawns with xs and scrubbing them
    for (let i = 1; i <= 8; i++) {
        for (let j = 0; j <= 7; j++) {
            let piece = curState[i][j]
            
            if (piece === "wPx") {
                curState[i][j] = "wP"
            } else if (piece === "bPx") {
                curState[i][j] = "bP"
            }
        }
    }

    //now check for any pawns that have NEWLY moved two tiles, and give them an X
    //only needs to check rows 4, 5 (in curState) and 2, 7 (in prevState) for white and black pawns, respectively
    let row4 = curState[4]
    let row2 = prevState[2]

    for (let i = 0; i < row4.length; i++) {
        let piece = row4[i]
        if (piece === "wP") { //potential pawn found
            //check if the pawn was in its starting position previously
            if (row2[i] === "wP") {
                //if so, add an X
                row4[i] = "wPx"
                curState[4] = row4
            }
        }
    }

    //as above, so below
    let row5 = curState[5]
    let row7 = prevState[7]

    for (let i = 0; i < row5.length; i++) {
        let piece = row5[i]
        if (piece === "bP") {
            if (row7[i] === "bP") {
                row5[i] = "bPx"
                curState[5] = row5
            }
        }
    }

    //return the altered state at the end
    return curState
}

export function validateMove(pieceCode, startPosition, endPosition, boardState) {
    //recieves a piece code
        //K - King
        //Q - Queen
        //N - Knight
        //B - Bishop
        //R - Rook
        //P - Pawn
    //starts with either a "w" or "b" for color
    //ends with the actual piece code

    const color = pieceCode.charAt(0)
    const piece = pieceCode.charAt(1)

    const startRow = startPosition[0]
    const startCol = startPosition[1]

    const endRow = endPosition[0]
    const endCol = endPosition[1]

    const endPiece = boardState[endRow][endCol]

    let copyState = structuredClone(boardState) //get a mutable copy of boardState

    //startPosition is starting coordinates (A1-H8), a 2-element array
    //its ending coordinates (also A1-H8), also a 2-element array

    //and the current board state, including the current positions of every piece

    //board looks like this
    // A8 B8 C8 D8 E8 F8 G8 H8 - black side
    // A7 B7 C7 D7 E7 F7 G7 H7
    // A6 B6 C6 D6 E6 F6 G6 H6
    // A5 B5 C5 D5 E5 F5 G5 H5
    // A4 B4 C4 D4 E4 F4 G4 H4
    // A3 B3 C3 D3 E3 F3 G3 H3
    // A2 B2 C2 D2 E2 F2 G2 H2
    // A1 B1 C1 D1 E1 F1 G1 H1 - white side
    //rows are numbers, as listed
    //columns are also numbers: 0-7, corresponding to A-H

    let white //note color
    if (color === "w") { white = true } else { white = false }

    let castling = false
    //first check if the color of the endPosition piece matches the active piece, if it does, immediately reject (you can't capture your own pieces)
    if (endPiece) { //empty strings always eval to true with startsWith, so we need to filter those out
        if (endPiece.startsWith(color)) {
            //we need to check for castling, the one exception to this rule
            if (piece === "K") { //possible castle
                //verify the king is on its starting square
                //and that its "target tile" is the starting tile of a rook of the same color, and said rook is still there
                if (white) { //white king
                    if (startRow === 1 && startCol === 4 && endRow === 1) { //valid king position
                        //check the rook...
                        if (endPiece === "wR") { //valid piece
                            if (endCol === 0 || endCol === 7) { //valid rook position
                                //continued in the switch statement...
                                castling = true
                            } else { //invalid rook position
                                return false
                            }
                        } else { //invalid piece
                            return false
                        }
                    } else { //invalid king position
                        return false
                    }
                } else { //black king
                    if (startRow === 8 && startCol === 4 && endRow === 8) { //valid king position
                        //check the rook...
                        if (endPiece === "bR") { //valid piece
                            if (endCol === 0 || endCol === 7) { //valid rook position
                                //continued in the switch statement...
                                castling = true
                            } else { //invalid rook position
                                return false
                            }
                        } else { //invalid piece
                            return false
                        }
                    } else { //invalid king position
                        return false
                    }
                }
            } else { //not a castle
                return false
            }
        }
    }

    let blocked = false //a secret tool that will help us later

    //matches piece and then does validation logic based on that
    switch (piece) {

        case "P":
            //pawns are unfortunately complicated
            //pawns can only move forward one space, except on their starting row, where they can move forward two
            //they CANNOT move forward if the space they're moving to is occupied -- they stop in place
            //they instead CAPTURE diagonally, which is also the only time they can move across columns
            
            //they ALSO have two special moves only for them: promotion and en passant
            //promotion is handled in another function, called directly by the game board
            //en passant is tracked elsewhere (checkPassant), but is handled here

            let start = false
            if (startRow === 2 || startRow === 7) {
                start = true //starting pawns move forward two, note that this applies to the enemy row, but it doesn't matter (only one space ahead at that point)
            }
            
            //note a capture attempt, THIS IS WHERE WE CHECK FOR PASSANT
            let capturing = false
            if (endPiece) {
                capturing = true
            } else {
                //check the spot BEHIND "endPiece", and if it's an enemy pawn with an X, we're passanting
                if (white && endRow - 1 >= 1) { //white pawn
                    let piece = boardState[endRow - 1][endCol]
                    if (piece === "bPx") {
                        capturing = true
                    } //else, whatever
                } else if (endRow + 1 <= 8) { //black pawn
                    let piece = boardState[endRow + 1][endCol]
                    if (piece === "wPx") {
                        capturing = true
                    }
                }
                //the actual capture is handled by the game board as usual
            }

            //check forward movement
            //"forward" in this case is determined by color, white goes UP in rows to go forward, black goes DOWN to go forward
            if (color === "w") {
                if (startRow + 1 === endRow) {
                    //continue...
                } else if (start && startRow + 2 === endRow) {
                    //need to make sure there's nothing in the pawn's way, they can't jump pieces like the Knight
                    let blockerPiece = boardState[startRow + 1][startCol]
                    if (blockerPiece) {
                        //console.log("Pawn movement blocked!")
                        return false 
                    } else if (capturing) {
                        //console.log("Pawns can't capture with their starting movement!")
                        return false
                    }
                    //else, continue...
                } else {
                    //console.log("Pawns must move FORWARD 1 (sometimes 2) squares!")
                    return false //invalid white pawn move
                }
            } else if (color === "b") {
                if (startRow - 1 === endRow) {
                    //continue...
                } else if (start && startRow - 2 === endRow) {
                    //need to make sure there's nothing in the pawn's way, they can't jump pieces like the Knight
                    let blockerPiece = boardState[startRow - 1][startCol]
                    if (blockerPiece) {
                        //console.log("Pawn movement blocked!")
                        return false 
                    } else if (capturing) {
                        //console.log("Pawns can't capture with their starting movement!")
                        return false
                    }
                    //else, continue...
                } else {
                    //console.log("Pawns must move FORWARD 1 (sometimes 2) squares!")
                    return false //invalid black pawn move
                }
            }

            //if the pawn is moving to an empty square, then we just need to make sure it's staying in it's lane
            if (capturing) { //but if it's moving to an OCCUPIED square...
                if (startCol === endCol) {
                    //console.log("Pawns can't capture directly in front of them.")
                    return false 
                } else if (startCol - 1 === endCol || startCol + 1 === endCol) {
                    //continue...
                } else {
                    //console.log("Pawns can't move diagonally more than one square!")
                    return false
                }
            } else { //stay in your lane
                if (startCol === endCol) {
                    //continue...
                } else {
                    //console.log("Pawns can only move horizontally when capturing!")
                    return false
                }
            }

            break;

        case "N":
            //knights move in L shapes, horizontally or vertically twice, and then vertically or horizontally (opposite previous) once
            //unlike other pieces, knights ignore if a piece is "in the way", jumping over them - this actually makes them somewhat simple to validate

            if (startCol + 2 === endCol || startCol - 2 === endCol) {
                if (startRow + 1 === endRow || startRow - 1 === endRow) {
                    //continue...
                } else {
                    //console.log("Knights only move in L shapes!")
                    return false
                }
            } else if (startRow + 2 === endRow || startRow - 2 === endRow) {
                if (startCol + 1 === endCol || startCol - 1 === endCol) {
                    //continue...
                } else {
                    //console.log("Knights only move in L shapes!")
                    return false
                }
            } else {
                //console.log("Knights only move in L shapes!")
                return false
            }

            break;
        
        case "R":
            //rooks move across rows and up/down columns exclusively, one of either the ending column or row MUST be the same as their starting position
            //conversely, the other CANNOT be the same, else they aren't moving

            // let vertical = false //secret tools, help us later...
            // let horizontal = false
            // let increment

            if (startCol === endCol && startRow !== endRow) {
                //continue...
            } else if (startRow === endRow && startCol !== endCol) {
                //continue...
            } else {
                //console.log("Rooks can only move orthogonally!")
                return false
            }

            //much like most other pieces, rooks can't "jump" other pieces; they get blocked
            //thus we have to check every square between their starting and ending positions
            blocked = checkBlockers(startPosition, endPosition, boardState)

            if (blocked) {
                //console.log("Rook movement blocked!")
                return false
            }

            break;
        
        case "B":
            //bishops move diagonally - they can't end their turn with EITHER the column or row matching their starting position

            if (startCol === endCol) {
                //console.log("Bishops can't move vertically!")
                return false
            } else if (startRow === endRow ) {
                //console.log("Bishops can't move horizontally!")
                return false
            }

            //that said, they can't move ANYWHERE they want, the (absolute value of) their "shift" must match both horizontally and vertically
            let h_shift = 0
            let v_shift = 0

            if (startRow < endRow) { //up/down
                v_shift = endRow - startRow
            } else {
                v_shift = startRow - endRow
            }

            if (startCol < endCol) { //left/right
                h_shift = endCol - startCol
            } else {
                h_shift = startCol - endCol
            }

            if (h_shift !== v_shift) {
                //console.log("Bishops can only move diagonally on a straight line!")
                return false
            }

            //much like most other pieces, bishops can't "jump" other pieces; they get blocked
            //thus we have to check every square between their starting and ending positions

            blocked = checkBlockers(startPosition, endPosition, boardState)

            if (blocked) {
                //console.log("Bishop movement blocked!")
                return false
            }
            
            break;

        case "Q":
            //the queen is the most unrestricted, moving like EITHER a bishop or a rook, but not both
            
            if (startCol !== endCol && startRow !== endRow) { //moving like a bishop
                let h_shift = 0
                let v_shift = 0
    
                if (startRow < endRow) { //up/down
                    v_shift = endRow - startRow
                } else {
                    v_shift = startRow - endRow
                }
    
                if (startCol < endCol) { //left/right
                    h_shift = endCol - startCol
                } else {
                    h_shift = startCol - endCol
                }
    
                if (h_shift !== v_shift) {
                    //console.log("Queens can only move diagonally on a straight line!")
                    return false
                }
            } //else, moving like a rook, which we don't need to double check

            //despite her mighty power, the queen still can't "jump" other pieces
            blocked = checkBlockers(startPosition, endPosition, boardState)

            if (blocked) {
                //console.log("Queen movement blocked!")
                return false
            }

            break;

        case "K":
            //the king can only move to unoccupied squares within one space, in any direction
            //EXCEPT... when castling, which is a special move only the king can do

            if (startCol + 1 === endCol || startCol - 1 === endCol || startCol === endCol) {
                if (startRow + 1 === endRow || startRow - 1 === endRow || startRow === endRow) {
                    //continue...
                } else {
                    //check for castling, anything other than a valid castle returns false from here
                    if (!castling) {
                        return false
                    }
                }
            } else {
                //check for castling, anything other than a valid castle returns false from here
                if (!castling) {
                    return false
                }
            }

            if (castling) {
                let validCastle = true

                //consists of moving the king two squares toward a rook on the same rank and then moving the rook to the square that the king passed over
                //permitted only if:
                    //neither the king nor the rook has previously moved;
                        //unfortunately coding a check like that is hard and outside the scope of this function,
                        //so we'll just assume that if the king and rook are both in their starting positions, they haven't moved
                    //the squares between the king and the rook are vacant;
                    //and the king does not leave, cross over, or finish on a square attacked by an enemy piece;
                        //which means we need to check for all three (start, skip, stop) of those squares
                
                //to check, in order:
                    //verify the king is on its starting square
                    //its "target tile" is the starting tile of a rook of the same color, and said rook is still there
                //these first two conditions are checked way above in the initial capture check

                //all the tiles in between the rook's and king's starting spaces are empty
                let blocked = checkBlockers([startRow, startCol], [endRow, endCol], boardState)
                if (blocked) {
                    validCastle = false
                }

                //none of the three tiles the king moves through would cause him to be "in check"
                if (validCastle) {
                    let shift = 0 //direction of motion
                    if (startCol < endCol) {
                        shift = 2
                    } else {
                        shift = -2
                    }

                    let check1, check2, check3

                    if (startCol + shift >= 0 && startCol + shift <= 7) {
                        let kingCopy1 = structuredClone(boardState) //starting space
                        let kingSpace = findKing(white, kingCopy1);
                        check1 = validateCheck(white, kingSpace[0], kingSpace[1], kingCopy1)
                        
                        kingCopy1[startRow][startCol] = "" 
                        kingCopy1[endRow][startCol + (shift / 2)] = pieceCode //skipped space
                        kingSpace = findKing(white, kingCopy1)
                        check2 = validateCheck(white, kingSpace[0], kingSpace[1], kingCopy1)

                        let kingCopy2 = structuredClone(boardState) 
                        kingCopy2[startRow][startCol] = ""
                        kingCopy2[endRow][startCol + shift] = pieceCode //end space
                        kingSpace = findKing(white, kingCopy2)
                        check3 = validateCheck(white, kingSpace[0], kingSpace[1], kingCopy2)
                    } else {
                        validCastle = false
                    }

                    if (check1 || check2 || check3) {
                        validCastle = false
                    }
                }

                if (!validCastle) { //invalid castle or other illegal move
                    //console.log("The King can only move one space at a time!")
                    return false
                }
                //afterwards, the special move function will notice that a castle happened and move the king/rook accordingly
            }

            //the main restriction on the king's movement is that he cannot move into any square that's threatened by an enemy piece
            //this is complex, but is also a problem that has to be solved via checking the new position for, well, check
            //this is done BELOW this switch statement in the general check validation

            break;

        default:
            console.error("Bad piece code!?")
            return false //no idea what's going on if it ever hits this, just throw
    }


    //need to check for, well, check, because any move that puts the king in check can't be done!
    //"move" the considered piece in our copy state, then check for check
    copyState[startRow][startCol] = ""
    copyState[endRow][endCol] = pieceCode
    let kingSpace = findKing(white, copyState);

    let check = validateCheck(white, kingSpace[0], kingSpace[1], copyState)
    
    if (check) {
        //console.log("You can't let the King be threatened!")
        return false
    }
    
    //also needs to handle special moves like en passant, pawn promotion, castling

    return true //if we make it all the way through without rejecting the move, it's valid
}

export function validateCheck(white, kingRow, kingCol, boardState) {

    //checks whether or not a given king is in check
    //white is whether or not the king in question is white - true if so, false if black
    //KingPos is a [row, column] array showing the current position of the king
    //boardState is the current (or imminent future, in case of King Movement) state of the board
    //needs to return true if the king is in check, false if the king isn't

    //needs to check for the following enemy pieces:
        //pawns diagonally in front of (above for white king, below for black king) the king 
        //knights within an L shape
        //bishops or queens within a diagonal
        //rooks or queens within an orthogonal
        //kings within 1 space of each other (this should only be possible for predictive moves)
    //this algorithm should check OUTWARD from the king's position, and when checking orthogonals or diagonals, STOP upon encountering a friendly piece (bodyguard)

    let king
    let otherKing
    if (white) {
        king = "wK"
        otherKing = "bK"
    } else {
        king = "bK"
        otherKing = "wK"
    }

    let friend
    if (white) {
        friend = "w"
    } else {
        friend = "b"
    }

    let enemy //secret tool, etc
    let piece
    let blockers

    //needs to check the following "knight spots" for enemy knights
    // - N - N - = 1, 2
    // N - - - N = 3, 4 
    // - - K - -
    // N - - - N = 5, 6
    // - N - N - = 7, 8
    
    const knightSpots = {
        1: [kingRow + 2, kingCol - 1],
        2: [kingRow + 2, kingCol + 1],
        3: [kingRow + 1, kingCol - 2],
        4: [kingRow + 1, kingCol + 2],
        5: [kingRow - 1, kingCol - 2],
        6: [kingRow - 1, kingCol + 2],
        7: [kingRow - 2, kingCol - 1],
        8: [kingRow - 2, kingCol + 1],
    }
    
    if (white) { //set enemy to look for
        enemy = "bN"
    } else {
        enemy = "wN"
    }

    //note that we can ignore any space that would be "out of bounds", aka out of the range of 1-8 for rows, and 0-7 for columns
    for (let i = 1; i <= 8; i++) {
        let coords = knightSpots[i]
        let knightRow = coords[0]
        let knightCol = coords[1]

        //out of bounds check
        if (knightRow > 8 || knightRow < 1) {
            continue
        }
        if (knightCol > 7 || knightCol < 0) {
            continue
        }

        piece = boardState[knightRow][knightCol]

        if (piece === enemy) { //danger knight found!!
            return true
        }
    }

    //orthogonals (rooks, queen)

    if (white) { //set enemies to look for and blockers
        enemy = ["bR", "bQ"]
        blockers = ["bB", "bN", "bP", "bK"]
    } else {
        enemy = ["wR", "wQ"]
        blockers = ["wB", "wN", "wP", "wK"]
    }

    //left of king
    for (let i = kingCol; i >= 0; i--) {
        piece = boardState[kingRow][i]

        if (piece === king) { //skip itself
            continue
        } else if (enemy.includes(piece)) { //danger!! rook/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }
    }

    //right of king
    for (let i = kingCol; i <= 7; i++) {
        piece = boardState[kingRow][i]

        if (piece === king) { //skip itself
            continue
        } else if (enemy.includes(piece)) { //danger!! rook/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }
    }

    //above king
    for (let i = kingRow; i <= 8; i++) {
        piece = boardState[i][kingCol]

        if (piece === king) { //skip itself
            continue
        } else if (enemy.includes(piece)) { //danger!! rook/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }
    }

    //below king
    for (let i = kingRow; i >= 1; i--) {
        piece = boardState[i][kingCol]

        if (piece === king) { //skip itself
            continue
        } else if (enemy.includes(piece)) { //danger!! rook/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }
    }

    //diagonals (bishops, queen)
    if (white) { //set enemies to look for and blockers
        enemy = ["bB", "bQ"]
        blockers = ["bR", "bN", "bP", "bK"]
    } else {
        enemy = ["wB", "wQ"]
        blockers = ["wR", "wN", "wP", "wK"]
    }

    let j = kingCol
    //up-right of king
    for (let i = kingRow; i <= 8; i++) {
        if (j < 0 || j > 7) {
            break; //out of bounds
        }

        piece = boardState[i][j]

        if (piece === king) { //skip itself
            j++
            continue
        } else if (enemy.includes(piece)) { //danger!! bishop/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }

        j++
    }

    j = kingCol
    //up-left of king
    for (let i = kingRow; i <= 8; i++) {
        if (j < 0 || j > 7) {
            break; //out of bounds
        }

        piece = boardState[i][j]

        if (piece === king) { //skip itself
            j--
            continue
        } else if (enemy.includes(piece)) { //danger!! bishop/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }

        j--
    }

    j = kingCol
    //down-right of king
    for (let i = kingRow; i >= 1; i--) {
        if (j < 0 || j > 7) {
            break; //out of bounds
        }

        piece = boardState[i][j]

        if (piece === king) { //skip itself
            j++
            continue
        } else if (enemy.includes(piece)) { //danger!! bishop/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }

        j++
    }

    j = kingCol
    //down-left of king
    for (let i = kingRow; i >= 1; i--) {
        if (j < 0 || j > 7) {
            break; //out of bounds
        }

        piece = boardState[i][j]

        if (piece === king) { //skip itself
            j--
            continue
        } else if (enemy.includes(piece)) { //danger!! bishop/queen approaching!!
            return true
        } else if (piece.startsWith(friend) || blockers.includes(piece)) { //bodyguard
            break;
        }

        j--
    }

    //huggers (pawns, the OTHER king)
    //needs to check the spaces immediately diagonally in front of (depending on color) the king
    if (white) {
        let pawn1 = ""
        if (kingRow + 1 <= 8 && kingCol + 1 <= 7) {
            pawn1 = boardState[kingRow + 1][kingCol + 1]
        }
        let pawn2 = ""
        if (kingRow + 1 <= 8 && kingCol - 1 >= 0) {
            pawn2 = boardState[kingRow + 1][kingCol - 1]
        }
        
        if (pawn1 === "bP" || pawn2 === "bP") { //danger pawn!!
            return true
        }
    } else {
        let pawn1 = ""
        if (kingRow - 1 >= 1 && kingCol + 1 <= 7) {
            pawn1 = boardState[kingRow - 1][kingCol + 1]
        }
        let pawn2 = ""
        if (kingRow - 1 >= 1 && kingCol - 1 >= 0) {
            pawn2 = boardState[kingRow - 1][kingCol - 1]
        }
        
        if (pawn1 === "wP" || pawn2 === "wP") { //danger pawn!!
            return true
        }
    }

    //needs to check the spaces immediately around the king for the other king
    for (let i = kingCol - 1; i <= kingCol + 1; i++) { //flip j and i's usual roles because I'm feeling spicy
        if (i < 0 || i > 7) {
            continue //out of bounds, ignore
        }

        for (let j = kingRow - 1; j <= kingRow + 1; j++) {
            if (j < 1 || j > 8) {
                continue //out of bounds, ignore
            }

            piece = boardState[j][i]

            if (piece === king) { //skip itself
                continue
            } else if (piece === otherKing) { //ultimate danger!! enemy king!!!
                return true
            }
        }
    }

    //if nothing trips above, return false
    return false
}

function legalMoves(pieceCode, startPosition, boardState) {
    //takes a piece, position, and board, and returns an array of all legal moves (end positions) that it can perform
    let moves = []

    for (let row = 1; row <= 8; row++) {
        for (let col = 0; col <= 7; col++) {
            let valid = validateMove(pieceCode, startPosition, [row, col], boardState)

            if (valid) {
                moves.push([row, col])
            }
        }
    }

    return moves
}

export function validateWin(white, boardState) {
    //checks if a given player has any remaining legal moves
    //if not, and their king is IN CHECK, the other player wins
    //if their king is NOT in check, the game is a draw
    //needs to return one of: "white", "black", or "draw" depending on who won, OR an empty string if there's no conclusion

    //to accomplish this, we'll do it in a very unoptimized way:
    //iterate over the whole board, grabbing each piece matching the provided player
    //then iterate over the whole board again, simulating moves for that piece
    //repeat until a legal move is found, or there are none left

    //if *any* legal moves are found, return an empty string, the game is still on

    let friend = "b"
    if (white) {
        friend = "w"
    }

    for (let row = 1; row <= 8; row++) {
        for (let col = 0; col <= 7; col++) {
            let piece = boardState[row][col]

            if (piece.startsWith(friend)) {
                let moves = legalMoves(piece, [row, col], boardState)

                if (moves.length > 0) {
                    return "" //legal moves found, game is still on
                } //else, continue
            }
        }
    }

    //if we get through that loop without returning, then the game is over, be it a draw or a win
    let king = findKing(white, boardState)
    let check = validateCheck(white, king[0], king[1], boardState)

    if (check) { //checkmate
        if (white) {
            return "Black"
        } else {
            return "White"
        }
    } else { //draw
        return "Draw"
    }

}

export function validateSpell() { //validates spells, not piece movement

}

export function validSpellcasts() {
    //takes a spell and the current board state and sends back all the possible valid moves for that spell
}