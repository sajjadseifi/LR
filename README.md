# LL1

# Gramer

    0 : S' -> S $
    1 : S  -> D O
    2 : D  -> draw
    3 : D  -> 
    4 : O  -> circle
    5 : O  -> box
    6 : O  ->

# Nullale Table 

    [
        { state: "S'", data: false },
        { state: 'S', data: true },
        { state: 'D', data: true },
        { state: 'O', data: true }
    ]

# First Table 

    [
        { state: "S'", data: [ '$', 'draw', 'circle', 'box' ] },
        { state: 'S', data: [ 'draw', 'circle', 'box' ] },
        { state: 'D', data: [ 'draw' ] },
        { state: 'O', data: [ 'circle', 'box' ] }
    ]

# Follow Table 

    [
        { state: "S'", data: [] },
        { state: 'S', data: [ '$' ] },
        { state: 'D', data: [ '$', 'circle', 'box' ] },
        { state: 'O', data: [ '$' ] }
    ]

# TableLL1 

    {
        states: [ "S'", 'S', 'D', 'O' ],
        column: [ '$', 'draw', 'circle', 'box' ],
        matrix: [ 
            [ 0, 0, 0, 0 ], 
            [ 1, 1, 1, 1 ], 
            [ 3, 2, 3, 3 ],
            [ 6, null, 4, 5 ] 
        ]
    }

# Example 1

    input source string : "draw $"
    $ S  | Expand  0
    $ O D  | Expand  1
    $ O draw  | Expand  2
    $ O  | Shift  draw
    $  | Expand  6
    Accepted.

# Example 2

    input source string : "draw draw $"
    S $  | Expand  0
    D O  | Expand  1
    Syntax Error

# Example 3
    input source string : "draw box box $"
    $ S  | Expand  0
    $ O D  | Expand  1
    $ O draw  | Expand  2
    $ O  | Shift  draw
    $ box  | Expand  5
    $  | Shift  box
    Accepted.# LR
