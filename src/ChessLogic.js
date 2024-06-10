
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
                    console.log("Queens can only move diagonally on a straight line!")
                    return false
                }
            } //else, moving like a rook, which we don't need to double check

            //despite her mighty power, the queen still can't "jump" other pieces
            blocked = checkBlockers(startPosition, endPosition, boardState)

            if (blocked) {
                console.log("Queen movement blocked!")
                return false
            }

            break;

        case "K":
            //the king can only move to unoccupied squares within one space, in any direction

            if (startCol + 1 === endCol || startCol - 1 === endCol || startCol === endCol) {
                if (startRow + 1 === endRow || startRow - 1 === endRow || startRow === endRow) {
                    //continue...
                } else {
                    console.log("The King can only move one space at a time! 2")
                    return false
                }
            } else {
                console.log("The King can only move one space at a time! 1")
                return false
            }

            //the main restriction on the king's movement is that he cannot move into any square that's threatened by an enemy piece
            //this is complex, but is also a problem that has to be solved via checking the new position for, well, check
            let white
            if (color === "w") { white = true } else { white = false }

            //"move" the king in our copy state
            copyState[startRow][startCol] = ""
            copyState[endRow][endCol] = pieceCode

            let check = validateCheck(white, endRow, endCol, copyState)
            
            if (check) {
                console.log("The King can't move into a space where he'd be threatened!")
                return false
            } //else, continue...

            break;

        default:
            console.error("Bad piece code!?")
            return false //no idea what's going on if it ever hits this, just throw
    }
    
    //also needs to handle special moves like en passant, pawn promotion, castling

    return true //if we make it all the way through without rejecting the move, it's valid
}

export function validMoves() {
    //takes a piece, its starting position, the current board state, and then sends back all squares that would be valid moves for that piece
}

export function validateCheck(white, kingRow, kingCol, boardState) {
    console.log(boardState)

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
    console.log(kingRow, kingCol)
    for (let i = kingRow; i <= 8; i++) {
        if (j < 0 || j > 7) {
            break; //out of bounds
        }

        piece = boardState[i][j]
        console.log(i, j + 1, piece)

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

export function validateWin() {

}

export function validateSpell() { //validates spells, not piece movement

}

export function validSpellcasts() {
    //takes a spell and the current board state and sends back all the possible valid moves for that spell
}