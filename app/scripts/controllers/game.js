'use strict';

angular.module('ss14Team113App')
  .controller('GameCtrl', function ($scope, $timeout, Game) {
      var boardSize = 10,
          cellSize = 40,
          pieceSize = {
              CARRIER: 5,
              BATTLESHIP: 4,
              CRUISER: 3,
              DESTROYER: 3,
              PATROL: 2
          },
          status = {
              EMPTY: 'EMPTY',
              CARRIER: 'CARRIER',
              BATTLESHIP: 'BATTLESHIP',
              CRUISER: 'CRUISER',
              DESTROYER: 'DESTROYER',
              PATROL: 'PATROL',
              MISS: 'MISS',
              HIT: 'HIT'
          },
          shipStatus = {
              carrier: {placed: false, rotated: false, sunk: false, hits: 0},
              battleship: {placed: false, rotated: false, sunk: false, hits: 0},
              cruiser: {placed: false, rotated: false, sunk: false, hits: 0},
              destroyer: {placed: false, rotated: false, sunk: false, hits: 0},
              patrol: {placed: false, rotated: false, sunk: false, hits: 0}
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

      function receiveShot(cell) {
          var row = cell.row - 1,
              col = cell.col - 1,
              result = boardStatus[row][col],
              cellId = "playerBoard" + row + col,
              cellEl = $('div[custom-id="' + cellId + '"]'),
              ship = result.toLowerCase(),
              gameOver = true,
              message;
          if(result !== status.EMPTY) {
              cellEl.addClass('hit');
              shipStatus[ship].hits = shipStatus[ship].hits + 1;
              if(shipStatus[ship].hits === pieceSize[result]) {
                  $('#' + ship).addClass('sunk-ship');
                  shipStatus[ship].sunk = true;
                  angular.forEach(shipStatus, function(ship) {
                      if(ship.sunk === true) {gameOver = false;}
                  });
                  if(gameOver){endGame();}
              }
          }
          else {
              boardStatus[cell.row-1][cell.col-1] = status.MISS;
              cellEl.addClass('miss');
          }
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
              row = shot.row - 1,
              col = shot.col - 1,
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
              // invalid message
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
              id = aDragEl.attr('id').toUpperCase(),
              row = parseInt(aDropEl.attr('row')),
              col = parseInt(aDropEl.attr('col'));
          if(validDropPosition(id, row, col)) {
              setShipPosition(aDragEl, dropEl);
              removeShip(id)
              updateBoardStatus(id, row, col);
              shipStatus[id.toLowerCase()].placed = true;
          }
      }

      function rotateShip(shipId) {
          var shipEl = $('#' + shipId),
              adjustment = (pieceSize[shipId.toUpperCase()] / 2 - .5) * cellSize,
              offset = shipEl.offset(),
              id = shipId.toUpperCase(),
              shipPos = getShipPosition(id),
              row = shipPos.row + 1,
              col = shipPos.col + 1,
              height = shipEl.css('width'),
              width = shipEl.css('height'),
              adjust1 = 8,
              adjust2 = 12;
             if(validRotation(shipId, row, col)) {
              if(shipStatus[shipId].rotated) {
                  var top = offset.top - adjust2,
                      left = offset.left - adjust1;
                     shipEl.css({backgroundImage: 'url(../images/' + shipId + '.gif)', top: top, left: left, height: height, width: width});
              }
              else { // not rotated
                  var top = offset.top - adjust1,
                      left = offset.left - adjust2;
                     shipEl.css({backgroundImage: 'url(../images/' + shipId + '-vert.gif)', top: top, left: left, height: height, width: width});
              }
              shipStatus[shipId].rotated = !shipStatus[shipId].rotated;
              removeShip(id);
              updateBoardStatus(id, row, col)
          }
      }

      function validDropPosition(id, row, col) {
          var length = pieceSize[id],
              rotated = shipStatus[id.toLowerCase()].rotated,
              position = rotated ? row : col;
          if(onBoard(length, position) && cellsEmpty(length, row, col, rotated, id)) {return true;}
          else {return false;}
      }

      function validRotation(shipId, row, col) {
          var id = shipId.toUpperCase(),
              length = pieceSize[id],
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
          var id = aDragEl.attr('id'),
              pos = dropEl.getBoundingClientRect(),
              rotated = shipStatus[id].rotated,
              adjustment = (pieceSize[id.toUpperCase()] / 2 - .5) * cellSize;
          if(rotated) {
              var top = pos.top,
                  left = pos.left;
              aDragEl.css({position: 'absolute', top: top, left: left});
          }
          else { // not rotated
              var top = pos.top - 7,
                  left = pos.left - 5;
              aDragEl.css({position: 'absolute', top: top, left: left});
          }
      }

      function setSunkShipPosition(ship) {
          var shipId = '#' + ship.type + 'Opponent',
              shipEl = $(shipId),
              cellId = '#oppBoard' + ship.startCell.row + ship.startCell.col,
              cellEl = $(cellId),
              pos = cellEl.offset(),
              adjustment = (pieceSize[ship.type.toUpperCase()] / 2 - .5) * cellSize;;
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
          var length = pieceSize[id];
          if(shipStatus[id.toLowerCase()].rotated) {
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
          //return true;
          angular.forEach(shipStatus, function(ship) {
            if(!ship.placed) {allPlaced = false}
          });
          return allPlaced;
      }

  });
