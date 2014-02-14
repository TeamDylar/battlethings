'use strict';
/**
 * TODO: Make ships all lower case for consitency.
 * TODO: Make board 0 - n-1 for consitency
 * TODO: Move piece size into ship status.
 * TODO: Make id / ship / shipId variable consistent
 * TODO: Try to separate game logic from board / move so can use in other games
 */
angular.module('ss14Team113App')
  .controller('GameCtrl', function ($scope, $timeout, Game) {
      var boardSize = 10,
          cellSize = 40,
          //pieceSize = {
          //    CARRIER: 5,
          //    BATTLESHIP: 4,
          //    CRUISER: 3,
          //    DESTROYER: 3,
          //    PATROL: 2
          //},
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

      $scope.dropped = function(dragEl, dropEl) {
          placeShip(dragEl, dropEl);
      }

      $scope.rotate = function(shipId) {
          if(shipStatus[shipId].placed) {rotateShip(shipId);}
      }

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

      // on scroll & resize calculate position of board.
      // difference between start and calculated is adjustment
      // to apply to position of ships.

      function receiveShot(cell) {
          var row = cell.row - 1,
              col = cell.col - 1,
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
              boardStatus[cell.row-1][cell.col-1] = status.MISS;
              cellEl.addClass('miss');
              data.message = Game.messages.MISS
          }
          data.details.gameOver = gameOver;
          Game.respondToShot(data);
          $scope.playersTurn = true;
          if(gameOver) {endGame();}
      }

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

      function validShot(row, col) {
          if(opponentBoardStatus[row-1][col-1] === status.EMPTY) {return true;}
          else {return false;}
      }

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

      function rotateShip(shipId) {
          var shipEl = $('#' + shipId),
              id = shipId,
              shipPos = getShipPosition(id),
              row = shipPos.row + 1,
              col = shipPos.col + 1,
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

      function validDropPosition(id, row, col) {
          var length = shipStatus[id].size,
              rotated = shipStatus[id].rotated,
              position = rotated ? row : col;
          if(onBoard(length, position) && cellsEmpty(length, row, col, rotated, id)) {return true;}
          else {return false;}
      }

      function validRotation(shipId, row, col) {
          var id = shipId,
              length = shipStatus[id].size,
              rotated = shipStatus[shipId].rotated,
              position = rotated ? col : row ;
          if(onBoard(length, position) && cellsEmpty(length, row, col, !rotated, id)) {return true;}
          else {return false;}
      }

      function onBoard(length, pos) {
          if(length + pos <= 11) {return true;}
          else {return false;}
      }

      function cellsEmpty(length, row, col, rotated, id) {
          if(rotated) {
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row-1 + i][col-1];
                  if(cell !== status[id] && cell !== status.EMPTY) {
                      return false;
                  }
              }
              return true
          }
          else { // not rotated
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row-1][col-1 + i];
                  if(cell !== status[id] && cell !== status.EMPTY) {
                      return false;
                  }
              }
              return true
          }
      }

      function setShipPosition(aDragEl, dropEl) {
          var aDropEl = angular.element(dropEl);
          aDragEl.detach();
          aDragEl.css({marginTop: -33, marginLeft: 4});
          aDropEl.append(aDragEl);
      }

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

      function updateBoardStatus(id, row, col) {
          var length = shipStatus[id].size;
          if(shipStatus[id].rotated) {
              for (var i = 0; i < length; i++) {
                  boardStatus[row-1 + i][col-1] = status[id];
              }
          }
          else {
              for (var i = 0; i < length; i++) {
                  boardStatus[row-1][col-1 + i] = status[id];
              }
          }
      }

      function setBoardSize(boardSize) {
        for(var i = 0; i < boardSize; i++) {
          $scope.rows.push(i);
          $scope.cells.push(i);
        }
      }

      function getShipPosition(id) {
          for(var i = 0; i < boardSize; i++) {
              for(var j = 0; j < boardSize; j++) {
                  if(boardStatus[i][j] === status[id]) {
                      return({row: i, col: j})
                  }
              }
          }
      }

      function removeShip(id) {
          for(var i = 0; i < boardSize; i++) {
              for(var j = 0; j < boardSize; j++) {
                  if(boardStatus[i][j] === status[id]) {
                      boardStatus[i][j] = status.EMPTY;
                  }
              }
          }
      }

      function placementComplete() {
          var allPlaced = true;
          // for testing
          return true;
          angular.forEach(shipStatus, function(ship) {
            if(!ship.placed) {allPlaced = false}
          });
          return allPlaced;
      }

      function endGame() {
          alert('Game Over');
          $scope.gameMessage = Game.messages.VICTORY;
      }

  });
