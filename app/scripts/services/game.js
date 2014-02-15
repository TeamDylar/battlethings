'use strict';

angular.module('ss14Team113App')
  .service('Game', function Game($q, $timeout) {

    var dataUrl = 'https://battlethings-dev1.firebaseio.com/',
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
        shotDeferred, // deferred returned by a shot that resolves to shot response data
        init = true, // boolean for initialization
        distributed = false; // flag for Firebase (true) or local synchronous (false).;

    // date ref for turn
    // - starts at 0, both create a random number, if 0 place number, if > num place num (so notify other player)
    //   larger numbers turn

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

        if(distributed) {
            console.log('distributed');
        }
        else { // test or single player
            $timeout(function() {
                deferred.notify(Game.messages.WAITING);
            }, 500);

            $timeout(function() {
                deferred.resolve(Game.messages.STARTING);
            }, 1000);
        }
        return deferred.promise;
    };

    this.checkTurn = function(playerId) {
      var Game = this,
          deferred = $q.defer();

      if(distributed) {
          console.log('distributed');
          //shotRef.set(shotPos, function(error) {
          //  if (error) {console.log('Data could not be saved.' + error);} 
          //  else {// No callback}
          //});
      }
      else { // test or single player
          $timeout(function() {
              deferred.notify(Game.messages.OPPONENTS_TURN);
          }, 500);

          $timeout(function() {
              deferred.resolve(Game.messages.YOUR_TURN);
          }, 1000);
      }
      return deferred.promise;
    };

    this.fireShot = function(playerId, row, col) {
      var Game = this,
          deferred = $q.defer(),
          shotPos = {row: row, col: col};
      shotDeferred = deferred;
      if(distributed) {
          //shotRef.set(shotPos, function(error) {
          //  if (error) {console.log('Data could not be saved.' + error);} 
          //  else {// No callback}
          //});
      }
      else { // test or single player
          $timeout(function() {
              var data = {row: row, col: col};
              angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
                  fn.call(Game, data);
              });

          }, 200);
      }
      return deferred.promise;
    };

    /**
     * respondToShot
     *
     * Send shot response information back to the opponent.
     */
    this.respondToShot = function(shotResponse) {
        if(distributed) {
            //responseRef.set(shotPos, function(error) {
            //  if (error) {console.log('Data could not be saved.' + error);} 
            //  else {// No callback}
            //});
        }
        else {
            shotDeferred.resolve(shotResponse);
        }
    };

    this.getPlayer = function() {
        return 'scott';
    };

    this.getOpponent = function() {
        return 'dennis';
    };

    turnRef.on('value', function(snapshot) {
        if(!init){return;}
        if(distributed) {
            //angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
            //    fn.call(Game, data);
            //});
        }
        else { // test or single player
            console.log("Error - shouldn't recieve shotRef.on in synchronous mode.");
        }
    });

    shotRef.on('value', function(snapshot) {
        if(!init){return;}
        if(distributed) {
            //angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
            //    fn.call(Game, data);
            //});
        }
        else { // test or single player
            console.log("Error - shouldn't recieve shotRef.on in synchronous mode.");
        }
    });

    responseRef.on('value', function(shotInfo) {
        if(!init){return;}
        if(distributed) {
            //shotDeferred.resolve(shotInfo);
        }
        else { // test or single player
            console.log("Error - shouldn't recieve responseRef.on in synchronous mode.");
        }
    });

    init = false;
  });
