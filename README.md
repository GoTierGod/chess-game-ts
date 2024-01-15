# Chess Game (Player VS AI)

This is a chess game where the player can play against an AI, the AI works by simulating AI and Player moves and qualifying them to choose the best, the AI has a ofensive attitude trying to capture the player pieces.

## AI Algorithm documentation (16-01-2024)

### `randomAction` Function

This algorithm defines a function called `randomAction` that performs a random move for a chess piece, either a safe move or a non-safe move. It considers the current game state, exposed pieces, and potential coronation actions.

#### Input Parameters

-   `safe`: A boolean flag indicating whether to perform a safe move (`true`) or a random move (`false`).
-   `board`: The current state of the chessboard.
-   `exposed`: Information about exposed pieces on the board, including the king, captures, and safe moves.
-   `setBoard`: React state setter for updating the chessboard.
-   `setSelected`: React state setter for updating the selected piece.
-   `setTurnCount`: React state setter for updating the turn count.
-   `coronation`: Information about a selected piece for coronation (promotion to a higher piece).
-   `toCrown`: Function to perform the coronation action based on the selected piece.
-   `repetition`: Information about repetition in moves for both the AI and the player.
-   `addRepetition`: Function to add a move to the repetition history.

#### Algorithm Steps

1. **Calculate Remaining Pieces**: Count the remaining AI (enemy) pieces on the board in each column and accumulate the total remaining pieces.

2. **Initialize Ranking and Blacklist**: Create an array (`ranking`) to store move rankings and an array (`blacklist`) to store blacklisted piece IDs.

3. **Define Safe Move Action and Move Action Functions**:

    - `safeMoveAction`: Function to perform safe moves based on the exposed pieces.
    - `moveAction`: Function to perform random moves without considering safety.

4. **Invoke the Correct Function**:

    - If `safe` is `true`, invoke the `safeMoveAction`; otherwise, invoke the `moveAction`.

5. **Reset Selected Piece and Update Turn Count**:

    - Set the selected piece to `null`.
    - Increment the turn count.

6. **Perform Coronation (Promotion)**:
    - If a `coronation` action is specified and the piece is not owned by the player, perform the coronation with the specified piece type ('Queen').

### `safeMoveAction` Function

This algorithm defines a function called `safeMoveAction` that computes a safe move for a chess piece on the board. The function considers the safety of the king and the values of potential moves.

#### Input Parameters

-   None

#### Output

-   None (but it updates the game state and board)

### Algorithm Steps

1. **Check for Exposure**: If the player's king is exposed, proceed with the safe move calculation.

2. **Select King Position**: Get the position of the exposed king.

3. **Sort Safe Moves**: Sort the safe moves based on the value of the pieces at the destination squares in descending order.

4. **Iterate Over Safe Moves**:

    - For each safe move, calculate a score using the `depthPredict` method.
    - Create a ranking object with information about the selected piece, the move, and the calculated score.

5. **Sort Ranking**: Sort the ranking in descending order based on the calculated scores.

6. **Avoid Repetition**:

    - Check for a repetitive move pattern in the AI's previous moves.
    - If repetition is detected, remove the repeated moves from consideration.

7. **Select Best Move**: Choose the best-ranked move while avoiding repetition.

8. **Update Board State**:

    - Get the column and index of the selected move.
    - Update the game board by removing the piece from the original position and placing it at the new position.

9. **Handle Repetition**:

    - Add the current move to the repetition history, avoiding repetition in subsequent moves of the AI king.

10. **Update Board State**: Update the game board with the new position of the moved piece.

### `moveAction` Function

This algorithm defines a function called `moveAction` that perform the movement of a chess piece based on a series of criteria, including piece selection, valid moves identification, ranking, and avoiding repetition.

#### Input Parameters

-   None

#### Output

-   None (but it updates the game state and board)

### Algorithm Steps

1. **Check Blacklist Limit**: Ensure that the blacklist of pieces to avoid is not exceeding the remaining pieces.

2. **Select a Random Piece**:

    - Choose a random column and index on the board.
    - If the selected piece is valid (not null, belongs to the AI player, and not in the blacklist), proceed; otherwise, recursively select another piece.

3. **Identify Valid Moves**:

    - Get the standard moves for the selected piece.
    - Filter out moves that result in clogged positions.
    - For the King, filter out moves that expose it to capture.

4. **Identify Capture Moves**:

    - Get capture moves for the selected piece.
    - Sort capture moves based on the value of the captured pieces.

5. **Rank Moves**:

    - For both standard and capture moves, calculate a score for each move using the `depthPredict` method.
    - Create a ranking object for each move, including information about the selected piece, the move, and the calculated score.
    - Add ranking objects to the global `ranking` array.

6. **Blacklist the Piece and Retry**:

    - Add the selected piece to the blacklist to avoid selecting it again.
    - Recursively call the `moveAction` function to select and evaluate a different piece.

7. **Make the Best Move**:

    - Once the blacklist limit is reached, sort the ranking array based on scores in descending order.
    - Check for repetitive move patterns and avoid them.
    - Choose the highest-ranked move that passes the repetition check.

8. **Update Board State**:

    - Update the game board by moving the selected piece to its new position.

9. **Handle Repetition**:
    - Add the current move to the repetition history.

## AI Methods Documentation (16-01-2024)

### `#expPredict` Method

This algorithm defines a method called `#expPredict`, which is used to predict whether a move will expose the opponent's king after the next move. It simulates the potential move on a fantasy board and checks if any capture moves by the current piece will expose the opponent's king, allowing it to capture the piece that is exposing it.

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `col`: The column of the potential move.
-   `idx`: The index of the potential move.
-   `current`: Information about the selected piece making the move, including its current position and piece type.

#### Output

-   An object containing two boolean properties:
    -   `exposing`: Indicates whether the move will expose the opponent's king.
    -   `exposed`: Indicates whether the opponent's king can capture the piece that is exposing it.

### Algorithm Steps

1. **Create a Fantasy Board**:

    - Create a deep copy of the current chessboard (`mirrorBoard`) to simulate the potential move.
    - Update the fantasy board by removing the selected piece from its current position and placing it in the potential move position.

2. **Get Capture Moves of the Current Piece**:

    - Use the `getCaptureMoves` method of the current piece to retrieve all possible capture moves from the potential move position.

3. **Check for Exposing Moves**:

    - Iterate through each capture move.
    - For each capture move, determine the column (`thisCol`) and index (`thisIdx`) of the capturing piece.
    - Check if the capturing piece is an opponent's king.
    - If it is a king, filter out moves that expose the king using the `isExposed` method.

4. **Check if the King Can Capture**:

    - Determine whether the opponent's king can capture the piece that is exposing it after the move.
    - Return an object with information about whether the move is exposing (`true`/`false`) and whether the king can capture the piece (`true`/`false`).

5. **Return Prediction**:
    - Return an object containing the exposing and exposed properties.

### `#defPredict` Method

This algorithm defines a method called `#defPredict` which is used for defensive move prediction in a chess-playing system. It evaluates the potential captures of the AI piece by surrounding enemy pieces and predicts the consequences of defensive moves.

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `col`: The column of the potential move.
-   `idx`: The index of the potential move.
-   `current`: Information about the AI piece making the move, including its current position and piece type.
-   `eaten`: The piece that would be captured in the defensive move (null if no capture).

#### Output

-   An array of `Predict` objects, each containing information about an enemy piece and the predicted consequences of capturing the AI piece.

### Algorithm Steps

1. **Create a Fantasy Board**:

    - Create a deep copy of the current chessboard (`mirrorBoard`) to simulate the potential move.
    - Update the fantasy board by removing the AI piece from its current position and placing it in the potential move position.

2. **Initialize a Queen for All-Around Enemies**:

    - Create a new instance of the Queen piece for the AI player (false indicates that it's not a player's piece) to conveniently identify all enemy positions around the potential move.

3. **Identify All Around Enemy Positions**:

    - Use the queen instance to get all possible capture moves around the potential move position.

4. **Evaluate Capture Moves of Surrounding Enemies**:

    - Iterate through the positions of all-around enemies.
    - For each enemy position, identify the piece at that position and its possible capture moves.
    - Check if the AI piece can be captured by any of these moves.

5. **Defensive Exposing Prediction**:

    - For each capturing enemy, predict the consequences of the defensive move:
        - Use the `#expPredict` method to check if the defensive move exposes the AI king.
        - Calculate the score based on whether the move exposes the king or not.
        - If exposing, assign a negative score; otherwise, assign the value of the captured piece minus the value of the AI piece.

6. **Return Predictions**:
    - Return an array of `Predict` objects, each containing information about an enemy piece and the predicted consequences of capturing the AI piece.

### `#ofPredict` Method

This algorithm defines a method called `#ofPredict`, which is used for offensive move prediction in a chess-playing system. It evaluates the potential captures of the opponent's piece by surrounding ally pieces and predicts the consequences of offensive moves.

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `col`: The column of the potential move.
-   `idx`: The index of the potential move.
-   `current`: Information about the selected piece making the move, including its current position and piece type.
-   `eater`: The piece that would be capturing the AI piece.

#### Output

-   An array of `Predict` objects, each containing information about an ally piece and the predicted consequences of capturing the AI piece.

### Algorithm Steps

1. **Create a Fantasy Board**:

    - Create a deep copy of the current chessboard (`mirrorBoard`) to simulate the potential move.
    - Update the fantasy board by removing the selected piece from its current position and placing it in the potential move position.

2. **Initialize a Queen for All-Around Allies**:

    - Create a new instance of the Queen piece for the opponent's player (true indicates that it's a player's piece) to conveniently identify all ally positions around the potential move.

3. **Identify All Around Ally Positions**:

    - Use the queen instance to get all possible capture moves around the potential move position.
    - Locate ally knights on the fantasy board and add their positions to the `allAround` array.

4. **Evaluate Capture Moves of Surrounding Allies**:

    - Iterate through the positions of all-around allies.
    - For each ally position, identify the piece at that position and its possible capture moves.
    - Check if the opponent's piece can be captured by any of these moves.

5. **Defensive Exposing Prediction**:

    - For each capturing ally, predict the consequences of the offensive move:
        - Use the `#expPredict` method to check if the offensive move exposes the opponent's king.
        - Calculate the score based on whether the move exposes the king or not.
        - If exposing, assign a positive score; otherwise, assign the value of the captured piece minus the value of the opponent's piece.

6. **Return Predictions**:
    - Return an array of `Predict` objects, each containing information about an ally piece and the predicted consequences of capturing the AI piece.

### `#depthPredict` Method

This algorithm defines a method called `#depthPredict`, which performs alternating defensive and offensive move predictions to determine the overall score for a given board position. It recursively evaluates the consequences of potential moves, considering both defensive and offensive aspects.

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `col`: The column of the potential move.
-   `idx`: The index of the potential move.
-   `selected`: Information about the selected piece making the move, including its current position and piece type.
-   `prevScore`: The accumulated score from previous predictions, initialized as `null` or a previous score.

#### Output

-   The overall score for the given board position, considering both defensive and offensive move predictions.

### Algorithm Steps

1. **Initialize Score and Identify Eaten Piece**:

    - Initialize the `score` variable with the provided `prevScore` or 0.
    - Determine if there is a piece at the potential move position (`eaten`).

2. **Defensive Prediction**:

    - Perform defensive move prediction using the `#defPredict` method, sorting the predictions from lower to higher based on the value of the capturing pieces.
    - Select the first (lowest value) defensive prediction (pessimistic choice).

3. **Offensive Prediction**:

    - If there is a defensive prediction, perform offensive move prediction using the `#ofPredict` method, sorting the predictions from higher to lower based on the value of the capturing pieces (optimistic choice).
    - If no defensive prediction, set the offensive predictions to an empty array.

4. **Calculate Scores**:

    - Calculate the total score by summing the scores of the selected defensive and offensive predictions.
    - Check if the move exposes the opponent's king using the `#expPredict` method, and if so, add a significant score (e.g., 1000).

5. **Score Adjustment for No Predictions**:

    - If there are no predictions (neither defensive nor offensive), adjust the score based on the value of the eaten piece (if any).

6. **Recursive Call for Offensive Predictions**:

    - If there is an offensive prediction, recursively call `#depthPredict` with the last offensive prediction's target position, selected piece, and updated score.

7. **Return Final Score**:
    - Return the final calculated score for the given board position.
