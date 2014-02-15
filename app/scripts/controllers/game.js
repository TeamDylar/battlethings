'use strict';
/**
 * TODO: Make id / ship / shipId variable consistent
 * TODO: Try to separate game logic from board / move so can use in other games
 *
 * TODO: switch status.HIT to status.hit etc.
 */
angular.module('ss14Team113App')
  .controller('GameCtrl', function ($scope, $timeout, Game) {
      var boardSize = 10,
          cellSize = 40,
          status = {
              empty: 'empty',
              carrier: 'carrier',
              battleship: 'battleship',
              cruiser: 'cruiser',
              destroyer: 'destroyer',
              patrol: 'patrol',
              miss: 'miss',
              hit: 'hit'
          },
          shipStatus = {
              carrier: {placed: false, rotated: false, sunk: false, hits: 0, size: 5},
              battleship: {placed: false, rotated: false, sunk: false, hits: 0, size: 4},
              cruiser: {placed: false, rotated: false, sunk: false, hits: 0, size: 3},
              destroyer: {placed: false, rotated: false, sunk: false, hits: 0, size: 3},
              patrol: {placed: false, rotated: false, sunk: false, hits: 0, size: 2}
          },
          boardStatus = initBoard(),
          opponentBoardStatus = initBoard();

      $scope.playerId = Game.getPlayer();
      $scope.opponentId = Game.getOpponent;

      $scope.gameSetup = true;
      $scope.gameMessage = Game.messages.STARTING;

      $scope.playersTurn = false;

      $scope.rows = [];
      $scope.cells = [];

      /**
       * $scope.dropped
       *
       * Triggered by upon drop portion of drag and drop.
       * Called if drag element is over a target element
       */
      $scope.dropped = function(dragEl, dropEl) {
          placeShip(dragEl, dropEl);
      }

      /**
       * $scope.rotate
       *
       * Triggered by player clicking on a ship.
       * Rotates the ship +/- 90 degrees
       */
      $scope.rotate = function(shipId) {
          if(shipStatus[shipId].placed) {rotateShip(shipId);}
      }

      /**
       * $scope.startGame
       *
       * Triggered by player click on placement complete button
       * Starts the game if all pieces are placed.
       */
      $scope.startGame = function() {
          if(!placementComplete()){
              alert('Must deploy all your animal warriors!');
          }
          else {
              $scope.gameSetup = false;

              Game.start($scope.playerId).then(function(message) {
                  $scope.gameMessage = message;
                  checkTurn();
              },
              function(reason) {
                  $scope.gameMessage = reason;
              },
              function(update) { // Waiting for opponent
                  $scope.gameMessage = update;
              });
          }
      }

      /**
       * $scope.fireShot
       *
       * Triggered by player clicking on opponents board
       * Fires a shot if it is the player's turn
       */
      $scope.fireShot = function(row, col) {
          if($scope.playersTurn && validShot(row, col)){
              $scope.playersTurn = false;
              Game.fireShot($scope.playerId, row, col).then(function(data) {
                  $scope.gameMessage = data.message;
                  updateOpponentsBoard(data);
                  $timeout(function() {
                      $scope.gameMessage = Game.messages.OPPONENTS_TURN;
                  }, 500);
                  checkTurn();
              },
              function(reason) {
                  $scope.gameMessage = reason;
              },
              function(update) { // Not used
                  $scope.gameMessage = update;
              });
          }
      }

      init();
      function init() {
          setBoardSize(boardSize);
          Game.registerFn(Game.callbackName.UPDATE_BOARD, receiveShot);
      }


      /**
       * receiveShot
       *
       * Callback passed to Game service to be called when opponent shoots.
       * Determines the results of the shot and updates the player's board.
       * Passes this info back to the opponent through the Game service via respondToShot.
       */
      function receiveShot(cell) {
          var row = cell.row,
              col = cell.col,
              result = boardStatus[row][col],
              cellId = "playerBoard" + row + col,
              cellEl = $('div[custom-id="' + cellId + '"]'),
              ship = result,
              gameOver = false,
              sunk = false,
              data = {details: {gameOver: false, shot: {row: row, col: col}, ship: {}}, message: ''};
          if(result !== status.EMPTY) { // HIT
              cellEl.addClass('hit');
              shipStatus[ship].hits = shipStatus[ship].hits + 1;
              data.message = Game.messages.HIT;
              if(shipStatus[ship].hits === shipStatus[result].size) { // SUNK
                  $('#' + ship).addClass('sunk-ship');
                  shipStatus[ship].sunk = true;
                  data.details.ship.startCell = getShipPosition(ship);
                  data.details.ship.type = ship;
                  data.details.ship.rotated = shipStatus[ship].rotated;
                  gameOver = true;
                  data.message = Game.messages.SUNK;
                  angular.forEach(shipStatus, function(ship) {
                      if(ship.sunk !== true) {
                        gameOver = false;
                      }
                  });
              }
          }
          else { // MISS
              boardStatus[cell.row][cell.col] = status.MISS;
              cellEl.addClass('miss');
              data.message = Game.messages.MISS
          }
          data.details.gameOver = gameOver;
          Game.respondToShot(data);
          $scope.playersTurn = true;
          if(gameOver) {endGame();}
      }

      /**
       * checkTurn
       */
      function checkTurn() {
          Game.checkTurn($scope.playerId).then(function(message) {
              $scope.playersTurn = true;
              $scope.gameMessage = message;
          },
          function(reason) {
              $scope.gameMessage = reason;
          },
          function(update) { // Opponent's Turn
              $scope.gameMessage = update;
          });
      }

      /**
       * updateOpponentsBoard
       *
       * Updates opponent's board on players screen.
       * Occurs after a player shoots and recieves the results back from the Game service
       * Recieves the data of the deferred passed back to $scope.fireShot
       */
      function updateOpponentsBoard(data) {
          var shot = data.details.shot,
              row = shot.row,
              col = shot.col,
              cell = "#oppBoard" + row + col;
          if(data.message === Game.messages.HIT) {
              $(cell).addClass('hit');
              opponentBoardStatus[row][col] = status.HIT;
          }
          else if(data.message === Game.messages.MISS) {
              $(cell).addClass('miss');
              opponentBoardStatus[row][col] = status.MISS;
          }
          else if(data.message === Game.messages.SUNK) {
              $(cell).addClass('hit');
              opponentBoardStatus[row][col] = status.HIT;
              setSunkShipPosition(data.details.ship);
          }
          else {
              console.log('Invalid Message: ' + data.message);
          }
      }

      /*
       * validShot
       */
      function validShot(row, col) {
          if(opponentBoardStatus[row][col] === status.EMPTY) {return true;}
          else {return false;}
      }

      /*
       * initBoard
       *
       * Creates the boardStatus object to hold game state
       * All status is initially set to empty.
       */ 
      function initBoard() {
          var board = [];
          for(var i = 0; i < boardSize; i++) {
              var row = [];
              for(var j = 0; j < boardSize; j++) {
                  row.push(status.EMPTY);
              }
              board[i] = row;
          }
          return board;
      }

      /**
       * placeShip
       *
       * Determines if a dropped ships position is valid
       * and if so places it and updates the board status
       */
      function placeShip(dragEl, dropEl) {
          var aDragEl = angular.element(dragEl),
              aDropEl = angular.element(dropEl),
              id = aDragEl.attr('id'),
              row = parseInt(aDropEl.attr('row')),
              col = parseInt(aDropEl.attr('col'));
          if(validDropPosition(id, row, col)) {
              setShipPosition(aDragEl, dropEl);
              removeShip(id)
              updateBoardStatus(id, row, col);
              shipStatus[id].placed = true;
          }
      }

      /**
       * rotateShip
       *
       * Rotates a ship if it is valid
       */
      function rotateShip(shipId) {
          var shipEl = $('#' + shipId),
              id = shipId,
              shipPos = getShipPosition(id),
              row = shipPos.row,
              col = shipPos.col,
              height = shipEl.css('width'),
              width = shipEl.css('height');
          if(validRotation(shipId, row, col) && $scope.gameSetup) {
              if(shipStatus[shipId].rotated) {
                  shipEl.css({backgroundImage: 'url(../images/' + shipId + '.gif)', height: height, width: width});
              }
              else { // not rotated
                  shipEl.css({backgroundImage: 'url(../images/' + shipId + '-vert.gif)', height: height, width: width});
              }
              shipStatus[shipId].rotated = !shipStatus[shipId].rotated;
              removeShip(id);
              updateBoardStatus(id, row, col)
          }
      }

      /**
       * validDropPosition
       *
       * Check that the ship will be on the board and that there aren't other ships there.
       */
      function validDropPosition(id, row, col) {
          var length = shipStatus[id].size,
              rotated = shipStatus[id].rotated,
              position = rotated ? row : col;
          if(onBoard(length, position) && cellsEmpty(length, row, col, rotated, id)) {return true;}
          else {return false;}
      }

      /**
       * validRotation
       *
       * Check that the ship will be on the board and that there aren't other ships there.
       */
      function validRotation(shipId, row, col) {
          var id = shipId,
              length = shipStatus[id].size,
              rotated = shipStatus[shipId].rotated,
              position = rotated ? col : row ;
          if(onBoard(length, position) && cellsEmpty(length, row, col, !rotated, id)) {return true;}
          else {return false;}
      }

      /**
       * onBoard
       *
       * Check the the ship will be on the board
       */
      function onBoard(length, pos) {
          if(length + pos <= 10) {return true;}
          else {return false;}
      }

      /**
       * cellsEmpty
       *
       * Check that there are no other ships in the cells
       */
      function cellsEmpty(length, row, col, rotated, id) {
          if(rotated) {
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row + i][col];
                  if(cell !== status[id] && cell !== status.EMPTY) {
                      return false;
                  }
              }
              return true
          }
          else { // not rotated
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row][col + i];
                  if(cell !== status[id] && cell !== status.EMPTY) {
                      return false;
                  }
              }
              return true
          }
      }

      /**
       * setShipPosition
       *
       * Upon a valid drop move the ship element to the target cell
       */
      function setShipPosition(aDragEl, dropEl) {
          var aDropEl = angular.element(dropEl);
          aDragEl.detach();
          aDragEl.css({marginTop: -33, marginLeft: 4});
          aDropEl.append(aDragEl);
      }

      /**
       * setSunkShipPosition
       *
       * Display a sunken ship to the opponents board.
       */
      function setSunkShipPosition(ship) {
          var shipId = '#' + ship.type + 'Opponent',
              shipEl = $(shipId),
              cellId = '#oppBoard' + ship.startCell.row + ship.startCell.col,
              cellEl = $(cellId),
              pos = cellEl.offset(),
              adjustment = (shipStatus[ship.type].size / 2 - .5) * cellSize;;
          if(ship.rotated) {
              var top = pos.top + adjustment - 7,
                  left = pos.left - adjustment - 5;
              shipEl.css({position: 'absolute', top: top, left: left, display: 'block', transform: 'rotate(90deg)'});
          }
          else { // not rotated
              var top = pos.top - 7,
                  left = pos.left - 5;
              shipEl.css({position: 'absolute', top: top, left: left, display: 'block'});
          }
      }

      /**
       * updateBoardStatus
       *
       * Update the board status object that a ship has been placed in certain cells
       */
      function updateBoardStatus(id, row, col) {
          var length = shipStatus[id].size;
          if(shipStatus[id].rotated) {
              for (var i = 0; i < length; i++) {
                  boardStatus[row + i][col] = status[id];
              }
          }
          else {
              for (var i = 0; i < length; i++) {
                  boardStatus[row][col + i] = status[id];
              }
          }
      }

      /**
       * setBoardSize
       *
       * Set the scope rows and cells object to the board size
       * so ng-repeat can create the correct board size.
       */
      function setBoardSize(boardSize) {
        for(var i = 0; i < boardSize; i++) {
          $scope.rows.push(i);
          $scope.cells.push(i);
        }
      }

      /**
       * getShipPosition
       *
       * Determine the position of a ships start cell on the board.
       * Used to determine the position for a valid rotation and
       * to pass a sunken ship's position to the opponent.
       */
      function getShipPosition(id) {
          for(var i = 0; i < boardSize; i++) {
              for(var j = 0; j < boardSize; j++) {
                  if(boardStatus[i][j] === status[id]) {
                      return({row: i, col: j})
                  }
              }
          }
      }

      /**
       * removeShip
       *
       * Clear the board status object of a ship when drop or rotate to a new position.
       */
      function removeShip(id) {
          for(var i = 0; i < boardSize; i++) {
              for(var j = 0; j < boardSize; j++) {
                  if(boardStatus[i][j] === status[id]) {
                      boardStatus[i][j] = status.EMPTY;
                  }
              }
          }
      }

      /**
       * placementComplete
       *
       * Verify that all ships have been placed when user wants to start the game.
       * Triggered by the placement complete button.
       */
      function placementComplete() {
          var allPlaced = true;
          // for testing
          return true;
          angular.forEach(shipStatus, function(ship) {
            if(!ship.placed) {allPlaced = false}
          });
          return allPlaced;
      }

      /**
       * endGame
       */
      function endGame() {
          alert('Game Over');
          $scope.gameMessage = Game.messages.VICTORY;
      }

  });
