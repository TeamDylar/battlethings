'use strict';

angular.module('ss14Team113App')
  .controller('GameCtrl', function ($scope) {
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
              PATROL: 'PATROL'
          },
          shipStatus = {
              carrier: {placed: false, rotated: false, sunk: false, hits: 0},
              battleship: {placed: false, rotated: false, sunk: false, hits: 0},
              cruiser: {placed: false, rotated: false, sunk: false, hits: 0},
              destroyer: {placed: false, rotated: false, sunk: false, hits: 0},
              patrol: {placed: false, rotated: false, sunk: false, hits: 0}
          },
          boardStatus = initBoard();

      $scope.rows = [];
      $scope.cells = [];

      $scope.dropped = function(dragEl, dropEl) {
          placeShip(dragEl, dropEl);
      }

      $scope.rotate = function(shipId) {
          rotateShip(shipId);
      }

      $scope.$on("SHIP-MOVE", function(event, id) {
          removeShip(id.toUpperCase())
      });

      init();

      function init() {
          setBoardSize(boardSize);
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
              updateBoardStatus(id, row, col);
          }
      }

      function rotateShip(shipId) {
          var shipEl = $('#' + shipId),
              adjustment = (pieceSize[shipId.toUpperCase()] / 2 - .5) * cellSize,
              offset = shipEl.offset();
          if(validRotation(shipId)) {
              if(shipStatus[shipId].rotated) {
                  var top = offset.top - 12,
                      left = offset.left - 8;
                  shipEl.css({transform: 'rotate(0deg)', top: top, left: left});
              }
              else { // not rotated
                  var adjustY = adjustment - 10,
                      adjustX = adjustment + 10,
                      top = offset.top + adjustY,
                      left = offset.left - adjustX;
                  shipEl.css({transform: 'rotate(90deg)', top: top, left: left});
              }
              shipStatus[shipId].rotated = !shipStatus[shipId].rotated;
              //updateBoardStatus(id, row, col) in func check for rotations
              // and clear old spots
          }
      }

      function validDropPosition(id, row, col) {
        var length = pieceSize[id],
            rotated = shipStatus[id.toLowerCase()].rotated;
        if(onBoard(length, col) && cellsEmpty(length, row, col, rotated, id)) {return true;}
        else {return false;}
      }

      function validRotation(shipId) {
          var id = shipId.toUpperCase(),
              shipPos = getShipPosition(id),
              length = pieceSize[id],
              rotated = shipStatus[shipId].rotated,
              row = shipPos.row + 1,
              col = shipPos.col + 1,
              position = rotated ? col : row ;
          if(onBoard(length, position) && cellsEmpty(length, row, col, !rotated, id)) {return true;}
          else {return false;}
      }

      function onBoard(length, pos) {
          console.log(length + pos);
          if(length + pos <= 11) {return true;}
          else {return false;}
      }

      function cellsEmpty(length, row, col, rotated, id) {
          console.log('row: ' + row);
          console.log('col: ' + col);
          if(rotated) {
              console.log('rotated');
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row-1 + i][col-1];
                  if(cell !== status[id] && cell !== status.EMPTY) {
                      console.log('row: ' + row);
                      console.log('col: ' + col);
                      console.log(boardStatus[row-1 + 1][col-1]);
                      return false;
                  }
              }
              return true
          }
          else {
              console.log('not rotated');
              for (var i = 0; i < length; i++) {
                  var cell = boardStatus[row-1][col-1 + i];
                  if(cell !== status[id] && cell !== status.EMPTY) {
                      console.log('row: ' + row);
                      console.log('col: ' + col);
                      console.log(boardStatus[row-1][col-1 + i]);
                      return false;
                  }
              }
              return true
          }
      }

      function setShipPosition(aDragEl, dropEl) {
          var pos = dropEl.getBoundingClientRect(),
              adjustY = 7,
              adjustX = 5,
              top = pos.top - adjustY,
              left = pos.left - adjustX;
          aDragEl.css({position: 'absolute', top: top, left: left});
      }

      function updateBoardStatus(id, row, col) {
          var length = pieceSize[id];
          for (var i = 0; i < length; i++) {
              boardStatus[row-1][col-1 + i] = status[id];
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

  });
