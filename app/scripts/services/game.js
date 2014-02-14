'use strict';

angular.module('ss14Team113App')
  .service('Game', function Game($q, $timeout) {

    var dataUrl = 'https://battlethings-dev1.firebaseio.com',
        baseRef = new Firebase(dataUrl),
        gameRoom = 'test1vstest2', // $location.query(gameroom) ?
        gameRef = baseRef.child('game/' + gameRoom),
        turnRef = gameRef.child('turn'),
        shotRef = gameRef.child('shot'),
        responseRef = gameRef.child('response'),
        callbacks = {
            UPDATE_BOARD: []
        },
        callbackName = {
            UPDATE_BOARD: 'UPDATE_BOARD'
        },
        shotDeferred;

    //dataRef = new Firebase('https://SampleChat.BATTLETHINGS-DEV1.com/');
    //
    // date ref for turn
    // - starts at 0, both create a random number, if 0 place number, if > num place num (so notify other player)
    //   larger numbers turn
    //
    // data ref for shot data
    //
    // data ref for shot response data

    this.messages = {
        STARTING: 'Game Starting',
        CHECKING_TURN: 'Checking Turn',
        YOUR_TURN: 'Your Turn',
        OPPONENTS_TURN: 'Opponents Turn',
        WAITING: 'Waiting for Opponent',
        VICTORY: 'You Won!',
        DEFEAT: 'You Lost :(',
        ERROR: 'System Error, Our Appologies',
        HIT: 'A Hit!',
        MISS: 'Missed',
        SUNK: 'Ship Sunk'
    };

    this.callbackName = callbackName;

    this.registerFn = function(fnName, fn) {
        callbacks[fnName].push(fn);
    }

    this.start = function(playerId) {
        var Game = this,
            deferred = $q.defer();

        $timeout(function() {
            deferred.notify(Game.messages.WAITING);
        }, 500);

        $timeout(function() {
            deferred.resolve(Game.messages.STARTING);
        }, 1000);

        return deferred.promise;
    };

    this.checkTurn = function(playerId) {
      var Game = this,
          deferred = $q.defer();

      //shotRef.set(shotPos, function(error) {
      //  if (error) {console.log('Data could not be saved.' + error);} 
      //  else {// No callback}
      //});

      $timeout(function() {
          deferred.notify(Game.messages.OPPONENTS_TURN);
      }, 500);

      $timeout(function() {
          deferred.resolve(Game.messages.YOUR_TURN);
      }, 1000);

      return deferred.promise;
    };

    this.fireShot = function(playerId, row, col) {
      var Game = this,
          deferred = $q.defer(),
          shotPos = {row: row, col: col};
      shotDeferred = deferred;

      $timeout(function() {
          var data = {row: row, col: col};
          angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
              fn.call(Game, data);
          });

      }, 200);

      //shotRef.set(shotPos, function(error) {
      //  if (error) {console.log('Data could not be saved.' + error);} 
      //  else {// No callback}
      //});

      return deferred.promise;
    };

    this.respondToShot = function(data) {
      //responseRef.set(shotPos, function(error) {
      //  if (error) {console.log('Data could not be saved.' + error);} 
      //  else {// No callback}
      //});
      shotDeferred.resolve(data);


    };

    this.getPlayer = function() {
        return 'scott';
    };

    this.getOpponent = function() {
        return 'dennis';
    };

    turnRef.on('value', function(snapshot) {
    });

    shotRef.on('value', function(snapshot) {
      //angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
      //    fn.call(Game, data);
      //});
    });

    responseRef.on('value', function(shotInfo) {
        //shotDeferred.resolve(shotInfo);
    });

    //dataRef.on('value', function(snapshot) {
    //$timeout(function() {
    //    var data = {};
    //    data.row = 1;
    //    data.col = 1;
    //    angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
    //        fn.call(Game, data);
    //    });
    //}, 4000);
    //});

  });
