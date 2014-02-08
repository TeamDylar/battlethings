'use strict';

angular.module('ss14Team113App')
  .controller('MainCtrl', function ($scope) {
    $scope.players = [
      'player 1',
      'player 2',
      'player 3',
      'player 4'
    ];
    var dataRef = new Firebase("https://battlethings-dev1.firebaseio.com");
    dataRef.set("I am now writing data into Firebase!");
  });
