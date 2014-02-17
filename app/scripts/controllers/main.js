'use strict';

angular.module('ss14Team113App')
  .controller('MainCtrl', function ($scope, $firebase) {
    console.log('got here');

    var connectedRef = new Firebase("https://battlethings-dev1.firebaseio.com/.info/connected");
    // connectedRef.on("value", function(snap) {
    //   if (snap.val() === true) {
    //     alert("connected");
    //   } else {
    //     alert("not connected");
    //   }
    // });


    var playersRef = new Firebase("https://battlethings-dev1.firebaseio.com/players");

    $scope.players = $firebase(playersRef);
    $scope.showChooseNameDiv = true;


    function scrubName(name) {
      if (!name) return false

      name = name.toLowerCase();
      name = name.replace(/\./g, ',');
      return name;
    }




    $scope.addPlayer = function() {
      if (!$scope.user.name) {

        alert('You have to enter a name!');
        return false;
      }
      console.log('$scope.user.name is ' + $scope.user.name);
      var myName = scrubName($scope.user.name);
      console.log('myName is ' + myName);


      var myPlayer = playersRef.child(myName);

      myPlayer.once('value', function(nameSnapshot) {
        var y = nameSnapshot.val();
        if (y === null) {
          // initialize name
          myPlayer.set({ name: $scope.user.name, status: 'available'});
          $scope.showChooseNameDiv = false
          $scope.showOpponentsDiv = true;
          console.log('showOpponentsDiv set to ' + $scope.showOpponentsDiv);
          myPlayer.on('value', function(nameSnapshot) {
            var z = nameSnapshot.val();
            //displays this player's status in 'your status' section 3
            $scope.lobbystatus = z.status;
            console.log('z = ' + z.name + ' ' + z.status);
            if ($scope.lobbystatus.match(/^game/i)) {
              // alert($scope.lobbystatus);
              $scope.showStartGame = true;
              $scope.showCancelRequest = true;
              }
            }
          )
        } else {
          alert('Name already taken');
          return false;
        }
        // if (typeof y !== "undefined") {
        //   alert(myName + ' already logged in');
        // }
        console.log('y = ' + y);

      });



      $scope.opponentList = function(opponentname) {
        console.log(opponentname);
        var myOpponent = playersRef.child(opponentname);
        myOpponent.set({ name: opponentname, status: 'Game Requested by ' + myName});
        myPlayer.set({ name: $scope.user.name, status: 'Requesting Game with ' + opponentname});
        $scope.chosenOpponent = opponentname;
        console.log('chosenOpponent = ' + $scope.chosenOpponent);
        $scope.showOpponentsDiv = false;
        $scope.showCancelRequest = true;
      }

      $scope.cancelRequest = function(username, opponentname) {
        console.log('username = ' + username);
        console.log('$scope.chosenOpponent = ' + $scope.chosenOpponent);
      }

      // myPlayer.onDisconnect().myOpponent.set({ name: opponentname, status: 'Game Requested by ' + myName});


      myPlayer.onDisconnect().remove();




      // $scope.players.$add({name: $scope.user.name, status: 'available'});
    };
  });
