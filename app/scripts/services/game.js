'use strict';

angular.module('ss14Team113App')
  .service('Game', function Game($q, $timeout) {

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
    }

    this.fireShot = function(playerId, row, col) {
      var Game = this,
          deferred = $q.defer();

      $timeout(function() {
          var data = {};
          data.message = Game.messages.MISS;
          data.details = {};
          data.details.shot = {};
          data.details.shot.row = row;
          data.details.shot.col = col;
          deferred.resolve(data);
      }, 500);

      return deferred.promise;
    }

    this.getPlayer = function() {
        return 'scott';
    };

    this.getOpponent = function() {
        return 'dennis';
    };

  });
