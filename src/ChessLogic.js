

export function validateMove(piece, startPosition, endPosition, boardState) {
    //recieves a piece code
        //K - King
        //Q - Queen
        //N - Knight
        //B - Bishop
        //R - Rook
        //P - Pawn
    //starts with either a "w" or "b" for color
    //its starting coordinates (A1-H8)
    //its ending coordinates (also A1-H8)
    //the color of the side performing the move (only really relevant for pawns)
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
    //columns are letters, rows are numbers
    //RECEIVED column is still a number, though

    //matches piece and then does validation logic based on that
    
    //pawns can only move forward one space, except on their first move, where they can move forward two
    //rows move across rows and up/down columns exclusively, one of either the column or row must be the same as their starting position
    //bishops move diagonally - they can't end their turn with EITHER the column or row matching their starting position
    //knights move in L shapes, horizontally or vertically twice, and then vertically or horizontally (opposite previous) once
        //unlike other pieces, knights ignore if a piece is "in the way", jumping over them
    //the queen is mostly unrestricted, moving like either a bishop or a rook
    //the king can only move to squares within one space, but otherwise without restriction

    //also needs to handle special moves like castling and en passant
    return true //TEMP
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