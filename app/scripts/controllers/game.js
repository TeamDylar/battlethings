'use strict';

angular.module('ss14Team113App')
  .controller('GameCtrl', function ($scope) {
      var boardSize = 10;

      $scope.rows = [];
      $scope.cells = [];

      init();

      $scope.dropped = function(dragEl, dropEl) {
          alert('here');
      }

      function init() {
          setBoardSize(boardSize);
      }

      function setBoardSize(boardSize) {
        for(var i = 0; i < boardSize; i++) {
          $scope.rows.push(i);
          $scope.cells.push(i);
        }
      }
  });
