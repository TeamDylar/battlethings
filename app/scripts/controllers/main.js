'use strict';

angular.module('ss14Team113App')
  .controller('MainCtrl', function ($scope, $firebase) {
    console.log('got here');
    var playersRef = new Firebase("https://battlethings-dev1.firebaseio.com/players");
    // evt.preventDefault();
    $scope.players = $firebase(playersRef);
    $scope.players.$add({player: 'Scott', status: 'available'});
    $scope.players.$add({player: 'Dennis', status: 'available'});
    // playersRef.update({name: 'Scott', status: 'ready'});
    // playersRef.update({name: 'Dennis', status: 'ready'});
    // $scope.players = [
    //   'player 1',
    //   'player 2',
    //   'player 3',
    //   'player 4'
    // ];

    // dataRef.set("I am now writing data into Firebase!");
  });
