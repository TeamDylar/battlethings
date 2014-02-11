'use strict';

angular.module('ss14Team113App')
  .service('Game', function Game($q, $timeout) {

    //var dataRef = new Firebase('https://SampleChat.firebaseIO-demo.com/users/fred/name/first');

    var callbacks = {
            UPDATE_BOARD: []
        },
        callbackName = {
            UPDATE_BOARD: 'UPDATE_BOARD'
        },
        shotDeferred;

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
          deferred = $q.defer();
      shotDeferred = deferred;

      $timeout(function() {
          var data = {};
          data.message = Game.messages.SUNK;
          data.details = {};
          data.details.shot = {};
          data.details.shot.row = row;
          data.details.shot.col = col;
          data.details.ship = {};
          data.details.ship.startCell = {};
          data.details.ship.startCell.row = 1;
          data.details.ship.startCell.col = 1;
          data.details.ship.type = 'carrier';
          data.details.ship.rotated = true;
          deferred.resolve(data);
      }, 500);

      return deferred.promise;
    };

    this.respondToShot = function(data) {
        //shotDeferred.resolve(data);
    };

    this.getPlayer = function() {
        return 'scott';
    };

    this.getOpponent = function() {
        return 'dennis';
    };

    //dataRef.on('value', function(snapshot) {
    $timeout(function() {
        var data = {};
        data.row = 1;
        data.col = 1;
        angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
            fn.call(Game, data);
        });
    }, 4000);
    //});

  });
