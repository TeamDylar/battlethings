'use strict';

angular.module('ss14Team113App')
  .controller('MainCtrl', function ($scope, $firebase) {
    console.log('got here');
    var playersRef = new Firebase("https://battlethings-dev1.firebaseio.com/players");
    // evt.preventDefault();

    $scope.players = $firebase(playersRef);


    function scrubName(name) {
      if (!name) return false

      name = name.toLowerCase();
      name = name.replace(/\./g, ',');
      return name;
    }




    $scope.addPlayer = function() {
      if (!$scope.name) {

        alert('You have to enter a name!');
        return false;
      }
      console.log('$scope.name is ' + $scope.name);
      var myName = scrubName($scope.name);
      console.log('myName is ' + myName);


      var myPlayer = playersRef.child(myName);

      myPlayer.once('value', function(nameSnapshot) {
        var y = nameSnapshot.val();
        if (y === null) {
          myPlayer.set({ name: $scope.name, status: 'available'});
        } else {
          alert('Name already taken');
          return false;
        }
        // if (typeof y !== "undefined") {
        //   alert(myName + ' already logged in');
        // }
        console.log('y = ' + y);

      });








      // $scope.players.$add({name: $scope.name, status: 'available'});
    };
  });
