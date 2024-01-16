# Chess Game (Player VS AI)

This is a chess game in which the player plays against an AI.

## Table of Contents

-   [1. Setup](#setup)
-   [2. AI Algorithm](#ai-algorithm)
-   [3. AI Methods](#ai-methods)
-   [4. Contributing](#contributing)
-   [5. License](#license)

## Setup

To set up the project, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/GoTierGod/chess-game-ts.git
    ```

2. Navigate to the project directory:

    ```bash
    cd chess-game-ts
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

## AI Algorithm

-   **Behavior:** Offensive.
-   **Operational Description:** The algorithm employs an offensive strategy by iteratively assessing potential moves for each AI piece. It integrates both defensive and offensive predictions, simulating the consequences of the AI's own moves and anticipating the responses from the opponent following the evaluation of a given move.
-   **Prediction Horizon:** The AI shows its ability to anticipate, making up to 64 depth predictions (128 subsequent movements) for each possible own movement. This forecast gradually decreases as pieces are captured over the course of the game, aligning with the reduction in the total number of feasible moves.

### `randomAction` Method

This algorithm defines a function called `randomAction` that performs a random move for a chess piece, either a safe move or a non-safe move. It considers the current game state, exposed pieces, and potential coronation actions.

#### Input Parameters

-   `safe`: A boolean flag indicating whether to perform a safe move (`true`) or a random move (`false`).
-   `board`: The current state of the chessboard.
-   `exposed`: Information about exposed pieces on the board, including the king, captures, and safe moves.
-   `setBoard`: React state setter for updating the chessboard.
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

#### Algorithm Steps

1. **Check for Exposure**: If the player's king is exposed, proceed with the safe move calculation.

2. **Select King Position**: Get the position of the exposed king.

3. **Sort Safe Moves**: Sort the safe moves based on the value of the pieces at the destination squares in descending order.

4. **Iterate Over Safe Moves**:

    - For each safe move, calculate a score using the `deepPredict` method.
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

#### Algorithm Steps

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

    - For both standard and capture moves, calculate a score for each move using the `deepPredict` method.
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

## AI Methods

### `#expPredict` Method

This algorithm implements the `#expPredict` method, designed to predict whether a chess move will expose the opponent's king after the next move. The method takes into account the current state of the chessboard, the potential move's coordinates, and information about the selected piece making the move.

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `next`: The coordinates of the potential move, including the column (`col`) and index (`idx`).
-   `current`: Information about the selected piece making the move, including its current position (`col` and `idx`) and piece type.

#### Output

-   An object containing two boolean properties:
    -   `exposing`: Indicates whether the move will expose the opponent's king.
    -   `exposed`: Indicates whether the opponent's king can capture the piece that is exposing it.

#### Algorithm Steps

1. **Create a Fantasy Board**:

    - Create a deep copy (`mirrorBoard`) of the current chessboard to simulate the potential move.
    - Update the fantasy board by removing the selected piece from its current position and placing it in the potential move position.

2. **Get Capture Moves of the Current Piece**:

    - Utilize the `getCaptureMoves` method of the current piece to obtain all possible capture moves from the potential move position.

3. **Check for Exposing Moves**:

    - Iterate through each capture move.
    - For each capture move, determine the column (`thisCol`) and index (`thisIdx`) of the capturing piece.
    - Check if the capturing piece is an opponent's king.
    - If it is a king, filter out moves that expose the king using the `isExposed` method.

4. **Check if the King Can Capture**:

    - Determine whether the opponent's king can capture the piece that is exposing it after the move.
    - Return an object with information about whether the move is exposing (`true`/`false`) and whether the king can capture the piece (`true`/`false`).

5. **Return Prediction**:

    - Return an object containing the `exposing` and `exposed` properties, indicating whether the move will expose the opponent's king and whether the king can capture the piece that is exposing it, respectively.

### `#defPredict` Method

This algorithm defines the `#defPredict` method, aimed at predicting defensive moves by evaluating potential capture moves of the opponent's pieces. The method considers the current state of the chessboard, the coordinates of the potential move, information about the selected piece making the move, and the type of piece that might be captured (`eaten`).

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `next`: The coordinates of the potential move, including the column (`col`) and index (`idx`).
-   `current`: Information about the selected piece making the move, including its current position (`col` and `idx`) and piece type.
-   `eaten`: The type of piece that might be captured (`null` if no piece is targeted).

#### Output

-   An array of `Predict` objects, each containing information about the opponent's piece, the potential capture move, and a score indicating the desirability of the move for defensive purposes.

#### Algorithm Steps

1. **Create a Fantasy Board**:

    - Create a deep copy (`mirrorBoard`) of the current chessboard to simulate the potential move.
    - Update the fantasy board by removing the selected piece from its current position and placing it in the potential move position.

2. **Identify All Around Enemies**:

    - Use a queen instance for convenience to identify all around enemies from the potential move position.
    - Locate enemy knights on the board and add their positions to the list of all around enemies.

3. **Capture Moves Evaluation**:

    - Iterate through each enemy position in the all around enemies list.
    - For each enemy position, identify the column (`thisCol`) and index (`thisIdx`) of the enemy piece.
    - Retrieve capture moves for the enemy piece using its `getCaptureMoves` method.
    - If the enemy piece is a king, filter out moves that expose the king using the `isExposed` method.

4. **Evaluate Exposing Predictions**:

    - Check if the enemy can capture the AI piece in the potential move.
    - Utilize the `#expPredict` method to predict whether the move will expose the opponent's king.

5. **Score Calculation**:

    - Assign a score to each potential defensive move based on exposing predictions, the type of piece being captured (`eaten`), and the value of the selected piece making the move.
    - Negative scores are assigned if the move exposes the enemy king without exposing the AI piece. Otherwise, positive scores are assigned based on the value of the piece being captured.

6. **Return Predictions**:

    - Return an array of `Predict` objects, each containing information about the opponent's piece, the potential capture move, and the calculated score.

### `#ofPredict` Method

This algorithm defines the `#ofPredict` method, focused on predicting offensive moves by evaluating potential capture moves of the opponent's pieces. The method considers the current state of the chessboard, the coordinates of the potential move, information about the selected piece making the move, and the piece that might capture the AI piece (`eater`).

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `next`: The coordinates of the potential move, including the column (`col`) and index (`idx`).
-   `current`: Information about the selected piece making the move, including its current position (`col` and `idx`) and piece type.
-   `eater`: Information about the piece that might capture the AI piece, including its current position (`col` and `idx`) and piece type.

#### Output

-   An array of `Predict` objects, each containing information about the opponent's piece, the potential capture move, and a score indicating the desirability of the move for offensive purposes.

#### Algorithm Steps

1. **Create a Fantasy Board**:

    - Create a deep copy (`mirrorBoard`) of the current chessboard to simulate the potential move.
    - Update the fantasy board by removing the selected piece making the move (`current.piece`) and the potential capturing piece (`eater.piece`) from their current positions and placing the latter in the potential move position.

2. **Identify All Around Allies**:

    - Use a queen instance for convenience to identify all around allies from the potential move position.
    - Locate ally knights on the board and add their positions to the list of all around allies.

3. **Capture Moves Evaluation**:

    - Iterate through each ally position in the all around allies list.
    - For each ally position, identify the column (`thisCol`) and index (`thisIdx`) of the ally piece.
    - Retrieve capture moves for the ally piece using its `getCaptureMoves` method.
    - If the ally piece is a king, filter out moves that expose the king using the `isExposed` method.

4. **Evaluate Exposing Predictions**:

    - Check if the ally can capture the AI piece in the potential move.
    - Utilize the `#expPredict` method to predict whether the move will expose the AI king.

5. **Score Calculation**:

    - Assign a score to each potential offensive move based on exposing predictions, the type of piece that might capture the AI piece (`eater`), and the value of the selected piece making the move.
    - Positive scores are assigned if the move exposes the AI king without exposing the ally piece. Otherwise, negative scores are assigned based on the value of the piece that might capture the AI piece.

6. **Return Predictions**:

    - Return an array of `Predict` objects, each containing information about the opponent's piece, the potential capture move, and the calculated score.

### `#deepPredict` Method

This algorithm defines the `#deepPredict` method, which alternates between defensive and offensive predictions to deeply analyze the potential consequences of a the AI own moves. The method considers the current state of the chessboard, the coordinates of the potential move, information about the selected piece making the move, and optional parameters for previous scores and deep levels.

#### Input Parameters

-   `board`: The current state of the chessboard.
-   `next`: The coordinates of the potential move, including the column (`col`) and index (`idx`).
-   `selected`: Information about the selected piece making the move, including its current position (`col` and `idx`) and piece type.
-   `prevScore`: The previous cumulative score from earlier predictions (default is `null`).
-   `prevDeep`: The previous deep level in the prediction sequence (default is `null`).

#### Output

-   A cumulative score indicating the desirability of the sequence of moves.

#### Algorithm Steps

1. **Initialize Variables**:

    - Set the initial score and deep level based on the provided or default values.
    - Identify the piece that might be captured (`eaten`) in the potential move.

2. **Defensive Prediction**:

    - Use the `#defPredict` method to predict defensive moves, sorting them from lower to higher values (pessimistic expectation).

3. **Offensive Prediction**:

    - If defensive predictions exist, use the best defensive move to predict offensive moves with the `#ofPredict` method. Sort the offensive predictions from higher to lower values (optimistic expectation).
    - If no defensive predictions exist, initialize an empty offensive predictions array.

4. **Score Calculation**:

    - Calculate the cumulative score based on the scores of the best defensive and offensive predictions.
    - Check if the move exposes the opponent's king without exposing the selected piece (`isExposing`). If true, add a bonus to the score.

5. **Handle Neutral Scenarios**:

    - If the cumulative scores are zero, adjust the score based on the value of the piece that might be captured (`eaten`).
    - If no piece is being captured, add a small penalty to the score.

6. **Recursive Deep Prediction**:

    - Increment the deep level.
    - If there is a last offensive prediction, recursively call `#deepPredict` with the coordinates of the last move and the piece making that move. Use the cumulative score and updated deep level.

7. **Return Cumulative Score**:

    - Return the cumulative score representing the desirability of the sequence of moves.

## Contributing

**Please note that contributions to this project are not permitted.**

While i appreciate your interest in contributing, i have currently decided to maintain the project in its current state.

We encourage you to explore the existing codebase, learn from it, and use it as a reference for your own projects.

Thank u for your understanding!

## License

This project is licensed under the [MIT License](https://github.com/GoTierGod/react-calculator/blob/main/LICENSE.md).
