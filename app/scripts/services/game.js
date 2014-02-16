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
            UPDATE_BOARD: [],
            SWITCH_TURN: []
        },
        callbackName = {
            UPDATE_BOARD: 'UPDATE_BOARD',
            SWITCH_TURN: 'SWITCH_TURN'
        },
        gameState = {
            READY: 'READY'
        },
        playersTurn = false,
        opponentReady = false,
        turnDeferred, // deferred returned by start that notifies of whose turn
        shotDeferred, // deferred returned by a shot that resolves to shot response data
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
    this.setInitialState = function() {
        if(distributed) {
            turnRef.set(0, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {
                  // No callback
                }
            });
            shotRef.set(0, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {
                  // No callback
                }
            });
            responseRef.set(0, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {
                  // No callback
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

        if(distributed) {
            if(opponentReady) {
                var randomNumber = Math.floor(Math.random() * 2), // 0 or 1
                    personsTurn = randomNumber === 1 ? this.getPlayer() : this.getOpponent();
                    turnRef.set(personsTurn, function(error) {
                        if (error) {console.log('Data could not be saved.' + error);} 
                        else {
                            console.log('Service - start: set turn to: ' + personsTurn);
                            if(personsTurn === Game.getPlayer()) {
                                playersTurn = true;
                                deferred.resolve(Game.messages.YOUR_TURN);
                            }
                            else if (personsTurn === Game.getOpponent()) {
                                playersTurn = false;
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
                        console.log('Service - start: set turn state to WAITING');
                        deferred.notify(Game.messages.WAITING);
                        turnDeferred = deferred;
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

    this.switchTurn = function(playerId) {
        if(distributed) {
            console.log('switching turns');
            turnRef.set(playerId, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {
                    // no callback
                }
            });
        }
        else { // test or single player
            $timeout(function() {
                deferred.notify(Game.messages.OPPONENTS_TURN);
            }, 500);

            $timeout(function() {
                deferred.resolve(Game.messages.YOUR_TURN);
            }, 1000);
        }
    }

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
          console.log('Services - fire shot - turn: ' + playersTurn);
          shotRef.set(shotPos, function(error) {
              if (error) {console.log('Shot data could not be saved.' + error);} 
              else {
                // No callback
              }
          });
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
            responseRef.set(shotResponse, function(error) {
              if (error) {console.log('Data could not be saved.' + error);} 
              else {
                // No callback
              }
            });
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

    turnRef.on('value', function(turnData) {
        var turnStatus = turnData.val();

        if(!turnStatus){return;}

        if(distributed) {

            if(turnStatus === gameState.READY) {
                console.log('opponent ready');
                opponentReady = true;
            }

            else if(turnDeferred) {
                console.log('Should only see once, resolving turn deferred');
                if(turnStatus === Game.getPlayer()) {
                    playersTurn = true;
                    turnDeferred.resolve(Game.messages.YOUR_TURN);
                }
                else if(turnStatus === Game.getOpponent()) {
                    playersTurn = false;
                    turnDeferred.resolve(Game.messages.OPPONENTS_TURN);
                }
                else {
                    turnDeferred.reject('Invalid turnStatus: ' + turnStatus);
                }
                turnDeferred = null;
            }
            else {
                var message;
                console.log('Service - turnRef - turn status: ' + turnStatus);
                if(turnStatus === Game.getPlayer()) {
                    playersTurn = true;
                    message = Game.messages.YOUR_TURN;
                }
                else if(turnStatus === Game.getOpponent()) {
                    playersTurn = false;
                    message = Game.messages.OPPONENTS_TURN;
                }
                else {
                    message = 'Invalid turnStatus: ' + turnStatus;
                }
                angular.forEach(callbacks[callbackName.SWITCH_TURN], function(fn) {
                    fn.call(Game, message);
                });

            }
        }
        else { // test or single player
            console.log("Error - shouldn't recieve shotRef.on in synchronous mode.");
        }
    });

    shotRef.on('value', function(shotData) {
        console.log('Service - shot ref - turn: ' + playersTurn);
        var shotInfo = shotData.val();

        if(!shotInfo || playersTurn){return;}
        console.log('Service - shot info: ' + shotInfo);
        if(distributed) {
              console.log('receiving shot');
              angular.forEach(callbacks[callbackName.UPDATE_BOARD], function(fn) {
                  fn.call(Game, shotInfo);
              });
        }
        else { // test or single player
            console.log("Error - shouldn't recieve shotRef.on in synchronous mode.");
        }
    });

    responseRef.on('value', function(responseData) {
        console.log('Service - response ref - turn: ' + playersTurn);
        var shotResponse = responseData.val();
        if(!shotResponse || !playersTurn){return;}

        if(distributed) {
            console.log('Service - response ref - firing deferred: ' + shotResponse);
            shotDeferred.resolve(shotResponse);
        }
        else { // test or single player
            console.log("Error - shouldn't recieve responseRef.on in synchronous mode.");
        }
    });

  });
