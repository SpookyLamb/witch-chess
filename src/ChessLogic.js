
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

    //first check if the color of the endPosition piece matches the active piece, if it does, immediately reject (you can't capture your own pieces)
    if (endPiece) { //empty strings always eval to true with startsWith, so we need to filter those out
        if (endPiece.startsWith(color)) {
            console.log("Can't capture own pieces.")
            return false
        }
    }

    //note a capture attempt
    let capturing = false
    if (endPiece) {
        capturing = true
    }

    let blocked = false //a secret tool that will help us later

    //matches piece and then does validation logic based on that
    switch (piece) {

        case "P":
            //pawns are unfortunately complicated
            //pawns can only move forward one space, except on their starting row, where they can move forward two
            //they CANNOT move forward if the space they're moving to is occupied -- they stop in place
            //they instead CAPTURE diagonally, which is also the only time they can move across columns

            let start = false
            if (startRow === 2 || startRow === 7) {
                start = true //pawns can move forward two, note that this does apply to the enemy's row too, but that doesn't matter (only one space ahead)
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
                        console.log("Pawn movement blocked!")
                        return false 
                    } else if (capturing) {
                        console.log("Pawns can't capture with their starting movement!")
                        return false
                    }
                    //else, continue...
                } else {
                    console.log("Pawns must move FORWARD 1 (sometimes 2) squares!")
                    return false //invalid white pawn move
                }
            } else if (color === "b") {
                if (startRow - 1 === endRow) {
                    //continue...
                } else if (start && startRow - 2 === endRow) {
                    //need to make sure there's nothing in the pawn's way, they can't jump pieces like the Knight
                    let blockerPiece = boardState[startRow - 1][startCol]
                    if (blockerPiece) {
                        console.log("Pawn movement blocked!")
                        return false 
                    } else if (capturing) {
                        console.log("Pawns can't capture with their starting movement!")
                        return false
                    }
                    //else, continue...
                } else {
                    console.log("Pawns must move FORWARD 1 (sometimes 2) squares!")
                    return false //invalid black pawn move
                }
            }

            //if the pawn is moving to an empty square, then we just need to make sure it's staying in it's lane
            if (capturing) { //but if it's moving to an OCCUPIED square...
                if (startCol === endCol) {
                    console.log("Pawns can't capture directly in front of them.")
                    return false 
                } else if (startCol - 1 === endCol || startCol + 1 === endCol) {
                    //continue...
                } else {
                    console.log("Pawns can't move diagonally more than one square!")
                    return false
                }
            } else { //stay in your lane
                if (startCol === endCol) {
                    //continue...
                } else {
                    console.log("Pawns can only move horizontally when capturing!")
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
                    console.log("Knights only move in L shapes!")
                    return false
                }
            } else if (startRow + 2 === endRow || startRow - 2 === endRow) {
                if (startCol + 1 === endCol || startCol - 1 === endCol) {
                    //continue...
                } else {
                    console.log("Knights only move in L shapes!")
                    return false
                }
            } else {
                console.log("Knights only move in L shapes!")
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
                console.log("Rooks can only move orthogonally!")
                return false
            }

            //much like most other pieces, rooks can't "jump" other pieces; they get blocked
            //thus we have to check every square between their starting and ending positions
            blocked = checkBlockers(startPosition, endPosition, boardState)

            if (blocked) {
                console.log("Rook movement blocked!")
                return false
            }

            break;
        
        case "B":
            //bishops move diagonally - they can't end their turn with EITHER the column or row matching their starting position

            if (startCol === endCol) {
                console.log("Bishops can't move vertically!")
                return false
            } else if (startRow === endRow ) {
                console.log("Bishops can't move horizontally!")
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
                console.log("Bishops can only move diagonally on a straight line!")
                return false
            }

            //much like most other pieces, bishops can't "jump" other pieces; they get blocked
            //thus we have to check every square between their starting and ending positions

            blocked = checkBlockers(startPosition, endPosition, boardState)

            if (blocked) {
                console.log("Bishop movement blocked!")
                return false
            }
            
            break;

        default:
            console.error("Bad piece code!?")
            return false //no idea what's going on if it ever hits this, just throw
    }
    
    
    //the queen is mostly unrestricted, moving like either a bishop or a rook
    //the king can only move to squares within one space, but otherwise without restriction

    //also needs to handle special moves like en passant, pawn promotion, castling

    return true //if we make it all the way through without rejecting the move, it's valid
}

export function validMoves() {
    //takes a piece, its starting position, the current board state, and then sends back all squares that would be valid moves for that piece
}

export function validateCheck() {

}

export function validateWin() {

}

export function validateSpell() { //validates spells, not piece movement

}

export function validSpellcasts() {
    //takes a spell and the current board state and sends back all the possible valid moves for that spell
}