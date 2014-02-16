'use strict';

angular.module('ss14Team113App')
  .service('Game', function Game($q, $timeout, $rootScope) {

    var Game = this,
        dataUrl = 'https://battlethings-dev1.firebaseio.com/',
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
        gameState = {
            READY: 'READY'
        },
        opponentReady = false,
        turnDeferred, // deferred returned by start that notifies of whose turn
        shotDeferred, // deferred returned by a shot that resolves to shot response data
        init = true, // boolean for initialization
        distributed = true; // flag for Firebase (true) or local synchronous (false).;

    /////////////////////////////////////
    // Game service public properties
    /////////////////////////////////////

    /**
     * Messages depicting possible game states
     */
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

    /**
     * A map of possible callback types to register
     */
    this.callbackName = callbackName;

    /////////////////////////////////////
    // Game service public functions
    /////////////////////////////////////

    /*(
     * registerFn
     *
     * Use to register callback to respond to opponent shots
     */
    this.registerFn = function(fnName, fn) {
        callbacks[fnName].push(fn);
    }

    /**
     * setTurnState
     *
     * Use on initialization to set turn state to 0
     */
    this.setTurnState = function() {
        if(distributed) {
            turnRef.set(0, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {// No callback
                    console.log('Set turn to 0');
                }
            });
        }
    }

    /**
     * start
     *
     * Starts a game.
     * Called when a player confirms their placement.
     * Checks if opponent is ready and chooses whose turn it is if they are.
     * Else notifies player they are waiting for opponent
     */
    this.start = function(playerId) {
        var Game = this,
            deferred = $q.defer();

        turnDeferred = deferred;

        if(distributed) {
            console.log('distributed');
            console.log(opponentReady);
            if(opponentReady) {
                var randomNumber = Math.floor(Math.random() * 2), // 0 or 1
                    personsTurn = randomNumber === 1 ? this.getPlayer() : this.getOpponent();
                    turnRef.set(personsTurn, function(error) {
                        if (error) {console.log('Data could not be saved.' + error);} 
                        else {
                            console.log('Set turn to: ' + personsTurn);
                            if(personsTurn === Game.getPlayer()) {
                                deferred.resolve(Game.messages.YOUR_TURN);
                            }
                            else if (personsTurn === Game.getOpponent()) {
                                deferred.resolve(Game.messages.OPPONENTS_TURN);
                            }
                            else {
                                console.log('Invalid person set during turn initialization.');
                            }
                        }
                    });
            }
            else {
                turnRef.set(gameState.READY, function(error) {
                    if (error) {console.log('Data could not be saved.' + error);} 
                    else {
                        console.log('Set turn state to READY');
                        deferred.notify(Game.messages.WAITING);
                    }
                });
            }
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
    // date ref for turn
    // - starts at 0, both create a random number, if 0 place number, if > num place num (so notify other player)
    //   larger numbers turn

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
        if(distributed) {
            return $rootScope.player;
        }
        else {
            return 'scott';  // TODO: fix to something else
        }
    };

    this.getOpponent = function() {
        if(distributed) {
            return $rootScope.opponent;
        }
        else {
            return 'dennis';  // TODO: fix to something else
        }
    };

    /////////////////////////////////////
    // Firebase response handlers
    /////////////////////////////////////

    turnRef.on('value', function(snapshot) {
        var turnStatus = snapshot.val();
        console.log(turnStatus);
        console.log(init);
        if(init){return;}
        if(distributed) {
            console.log('turnStatus: ' + turnStatus);
            console.log('game ready: ' + gameState.READY);

            if(turnStatus === gameState.READY) {
                console.log('opponent ready');
                opponentReady = true;
            }

            else if(turnDeferred) {
                if(turnStatus === Game.getPlayer()) {
                    turnDeferred.resolve(Game.messages.YOUR_TURN);
                }
                else if(turnStatus === Game.getOpponent()) {
                    turnDeferred.resolve(Game.messages.OPPONENTS_TURN);
                }
                else {
                    turnDeferred.reject('Invalid turnStatus: ' + turnStatus);
                }
                turnDeferred = null;
            }
            //angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
            //    fn.call(Game, data);
            //});
        }
        else { // test or single player
            console.log("Error - shouldn't recieve shotRef.on in synchronous mode.");
        }
    });

    shotRef.on('value', function(snapshot) {
        if(init){return;}
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
        if(init){return;}
        if(distributed) {
            //shotDeferred.resolve(shotInfo);
        }
        else { // test or single player
            console.log("Error - shouldn't recieve responseRef.on in synchronous mode.");
        }
    });

    init = false;
  });
