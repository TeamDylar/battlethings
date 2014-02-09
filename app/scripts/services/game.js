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
        ERROR: 'System Error, Our Appologies'
    };

    this.start = function(playerId) {
        var Game = this,
            deferred = $q.defer();

        $timeout(function() {
            deferred.notify(Game.messages.WAITING);
        }, 500);

        $timeout(function() {
            deferred.resolve(Game.messages.STARTING);
        }, 1500);

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
      }, 2000);

      return deferred.promise;
    }

    this.getPlayer = function() {
        return 'scott';
    };

    this.getOpponent = function() {
        return 'dennis';
    };

  });
