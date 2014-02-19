'use strict';
/**
 * TODO: Make id / ship / shipId variable consistent
 * TODO: Try to separate game logic from board / move so can use in other games
 *
 * TODO: Pass global vars into functions when possilbe
 * TODO: Minimize scope usage by returning values to specific functions that affect scope
 *       intead of actually setting scope in functions.
 * TODO: Move DOM affecting functions to directives.
 */
angular.module('ss14Team113App')
  .controller('GameCtrl', function ($scope, $timeout, $rootScope, Game) {
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

      /////////////////////////////////////
      // Scope properties
      /////////////////////////////////////

      $scope.playerId = Game.getPlayer();
      $scope.opponentId = Game.getOpponent();

      $scope.gameSetup = true;
      $scope.gameMessage = Game.messages.STARTING;

      $scope.playersTurn = false;

      $scope.rows = [];
      $scope.cells = [];

      /////////////////////////////////////
      // Scope functions
      /////////////////////////////////////

      /**
       * $scope.dropped
       *
       * Triggered upon drop portion of a drag and drop.
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
          if(!placementComplete()) {alert('Must deploy all your animal warriors!');}
          else {
              $scope.gameSetup = false;
              Game.start().then(function(message) { /* Game will start with switch turn call. */},
              function(reason) { // reject if WAITING for opponent.
                  $scope.gameMessage = reason;
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
              },
              function(reason) {
                  $scope.gameMessage = reason;
              },
              function(update) { // Not used
                  $scope.gameMessage = update;
              });
          }
      }

      /////////////////////////////////////
      // Initialization
      /////////////////////////////////////

      init();
      function init() {
          setBoardSize(boardSize);
          Game.registerFn(Game.callbackName.RECEIVE_SHOT, receiveShotResponse);
          Game.registerFn(Game.callbackName.SWITCH_TURN, switchTurnResponse);
          Game.setInitialState();
      }


      /////////////////////////////////////
      // Private Functions - Affecting Scope, DOM, or class variables
      /////////////////////////////////////

      /**
       * receiveShotResponse
       *
       * Callback passed to Game service to be called when opponent shoots.
       * Determines the results of the shot and updates the player's board.
       * Passes this info back to the opponent through the Game service via respondToShot.
       *
       * TODO: Move to Board Directive? Manipulates DOM
       */
      function receiveShotResponse(cell) {
          var result = boardStatus[cell.row][cell.col],
              cellId = "playerBoard" + cell.row + cell.col,
              cellEl = $('div[custom-id="' + cellId + '"]'),
              shipId = result,
              gameOver = false,
              data = {details: {gameOver: false, 
                                shot: {row: cell.row, col: cell.col}, 
                                ship: {}}, 
                      message: '',
                      playerId: $scope.playerId};
          if(result !== status.empty) { // HIT
              cellEl.addClass('hit');
              shipStatus[shipId].hits = shipStatus[shipId].hits + 1;
              data.message = Game.messages.HIT;
              if(shipStatus[shipId].hits === shipStatus[shipId].size) { // SUNK
                  $('#' + shipId).addClass('sunk-ship');
                  shipStatus[shipId].sunk = true;
                  data.details.ship.startCell = getShipPosition(shipId);
                  data.details.ship.type = shipId;
                  data.details.ship.rotated = shipStatus[shipId].rotated;
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
              cellEl.addClass('miss');
              data.message = Game.messages.MISS
          }
          data.details.gameOver = gameOver;
          Game.respondToShot(data);
          $scope.playersTurn = true;
          if(gameOver) {endGame();}
      }

      /**
       * switchTurnResponse
       *
       * Callback passed to Game service to be called when turns switch.
       * Recieves a message of either YOUR_TURN or OPPONENTS_TURN and 
       * sets the $scope.playersTurn variable to true or false respectively
       * Needs $apply() since triggered by Firebase callback responseRef.on update
       */
      function switchTurnResponse(message) {
          $scope.gameMessage = message;
          if(message === Game.messages.YOUR_TURN) {
              $scope.playersTurn = true;
          }
          else if(message === Game.messages.OPPONENTS_TURN) {
              $scope.playersTurn = false;
          }
          else {
              console.log('Invalid switch turn message: ' + message);
          }
          $scope.safeApply();
      }

      /**
       * updateOpponentsBoard
       *
       * Updates opponent's board on players screen.
       * Occurs after a player shoots and recieves the results back from the Game service
       * Recieves the data of the deferred passed back to $scope.fireShot
       *
       * TODO: Move to directive(BOARD) uppdate board?
       */
      function updateOpponentsBoard(data) {
          var shot = data.details.shot,
              cell = "#oppBoard" + shot.row + shot.col;
          switch (data.message)
          {
          case Game.messages.SUNK:
            setSunkShipPosition(data.details.ship);
            // Intentional fall through - sunk is a hit
          case Game.messages.HIT:
            $(cell).addClass('hit');
            opponentBoardStatus[shot.row][shot.col] = status.hit;
            break;
          case Game.messages.MISS:
            $(cell).addClass('miss');
            opponentBoardStatus[shot.row][shot.col] = status.miss;
            break;
          default:
            console.log('Invalid Message: ' + data.messages);
          }
          Game.switchTurn(Game.getOpponent());
      }

      /**
       * validShot
       *
       * TODO: Move to directive(BOARD) valid action?
       */
      function validShot(row, col) {
          if(opponentBoardStatus[row][col] === status.empty) {return true;}
          else {return false;}
      }

      /**
       * initBoard
       *
       * Creates the boardStatus object to hold game state
       * All status is initially set to empty.
       *
       * TODO: Move to directive (BOARD) 
       */ 
      function initBoard() {
          var board = [];
          for(var i = 0; i < boardSize; i++) {
              var row = [];
              for(var j = 0; j < boardSize; j++) {
                  row.push(status.empty);
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
       *
       * TODO: Move to directive (BOARD) call placeItem
       */
      function placeShip(dragEl, dropEl) {
          var aDragEl = angular.element(dragEl),
              aDropEl = angular.element(dropEl),
              shipId = aDragEl.attr('id'),
              row = parseInt(aDropEl.attr('row')),
              col = parseInt(aDropEl.attr('col'));
          if(validDropPosition(shipId, row, col)) {
              setShipPosition(aDragEl, dropEl);
              removeShip(shipId)
              updateBoardStatus(shipId, row, col);
              shipStatus[shipId].placed = true;
          }
      }

      /**
       * rotateShip
       *
       * Rotates a ship if it is valid
       *
       * TODO: Move to directive (SHIP? or BOARD PIECE?)
       */
      function rotateShip(shipId) {
          var shipEl = $('#' + shipId),
              shipPos = getShipPosition(shipId),
              height = shipEl.css('width'),
              width = shipEl.css('height'),
              urlTail = shipStatus[shipId].rotated ? '.gif)' : '-vert.gif)';
          if(validRotation(shipId, shipPos.row, shipPos.col) && $scope.gameSetup) {
              shipEl.css({
                backgroundImage: 'url(../images/' + shipId + urlTail,
                height: height,
                width: width
              });
              shipStatus[shipId].rotated = !shipStatus[shipId].rotated;
              removeShip(shipId);
              updateBoardStatus(shipId, shipPos.row, shipPos.col)
          }
      }

      /**
       * validDropPosition
       *
       * Check that the ship will be on the board and that there aren't other ships there.
       *
       * TODO: Move to directive (BOARD)
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
       *
       * TODO: Move to directive (BOARD)
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
       *
       * TODO: Move to directive (BOARD)
       */
      function onBoard(length, pos) {
          if(length + pos <= 10) {return true;}
          else {return false;}
      }

      /**
       * cellsEmpty
       *
       * Check that there are no other ships in the cells
       *
       * TODO: Move to directive (BOARD)
       */
      function cellsEmpty(length, row, col, rotated, id) {
          if(rotated) {
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row + i][col];
                  if(cell !== status[id] && cell !== status.empty) {
                      return false;
                  }
              }
              return true
          }
          else { // not rotated
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row][col + i];
                  if(cell !== status[id] && cell !== status.empty) {
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
       * TODO: Move to directive (CELL?) since manipulates DOM
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
       *
       * TODO: Move to directive (CELL)
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
       *
       * TODO: underscore
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
       *
       * TODO: underscore
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
       *
       * TODO: underscore
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
       *
       * TODO: underscore
       */
      function removeShip(id) {
          for(var i = 0; i < boardSize; i++) {
              for(var j = 0; j < boardSize; j++) {
                  if(boardStatus[i][j] === status[id]) {
                      boardStatus[i][j] = status.empty;
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
       *
       * TODO: not done
       */
      function endGame() {
          alert('Game Over');
          $scope.gameMessage = Game.messages.VICTORY;
      }

      /////////////////////////////////////
      // Private Functions - PURE
      /////////////////////////////////////

      /////////////////////////////////////
      // TODO: move to utility
      /////////////////////////////////////
      $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
          if(fn && (typeof(fn) === 'function')) {
            fn();
          }
        } else {
          this.$apply(fn);
        }
      };
/// HERE WE ARE
      /////////////////////////////////////
      // Testing
      /////////////////////////////////////

      $scope.manualTesting = true;  // use to set player and opponent names manually

      $scope.$watch('testPlayer', function() {
          if($scope.manualTesting) {
              $rootScope.player = $scope.testPlayer;
              $scope.playerId = $scope.testPlayer;
          }
      });

      $scope.$watch('testOpponent', function() {
          if($scope.manualTesting) {
              $rootScope.opponent = $scope.testOpponent;
              $scope.opponentId = $scope.testOpponent
          }
      });

  });
