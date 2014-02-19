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
            RECEIVE_SHOT: [],
            SWITCH_TURN: []
        },
        callbackName = {
            RECEIVE_SHOT: 'RECEIVE_SHOT',
            SWITCH_TURN: 'SWITCH_TURN'
        },
        gameState = {
            READY: 'READY'
        },
        playersTurn = false,
        opponentReady = false,
        shotDeferred, // deferred returned by a shot that resolves to shot response data
        distributed = true; // flag for Firebase distributed asynch (true) or local synchronous (false).;

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
     * setInitialState
     *
     * Called on initialization to set states to 0 for turn, shot, and response refs.
     */
    this.setInitialState = function() {
        if(distributed) {
            turnRef.set(0, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {/* No callback for data set op */}
            });
            shotRef.set(0, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {/* No callback for data set op */}
            });
            responseRef.set(0, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {/* No callback for data set op */}
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
    this.start = function() {
        var Game = this,
            deferred = $q.defer(),
            randomNumber = Math.floor(Math.random() * 2), // 0 or 1
            personsTurn = randomNumber === 1 ? this.getPlayer() : this.getOpponent();
        if(distributed) {
            if(opponentReady) {
                turnRef.set(personsTurn, function(error) {
                    if (error) {console.log('Data could not be saved.' + error);} 
                    else {deferred.resolve(Game.messages.STARTING);}
                });
            }
            else {
                turnRef.set(gameState.READY, function(error) {
                    if (error) {console.log('Data could not be saved.' + error);} 
                    else {deferred.reject(Game.messages.WAITING);}
                });
            }
        }
        else { // test or single player
            deferred.resolve(Game.messages.STARTING);
            $timeout(function() {
                angular.forEach(callbacks[callbackName.SWITCH_TURN], function(fn) {
                    // later can make random start chance with opponent
                    fn.call(Game, Game.messages.YOUR_TURN);
                });
            }, 1000);
        }
        return deferred.promise;
    };

    /**
     * switchTurn
     *
     * Switch the turn to player whose ID is passed in.
     * Sets the turnRef to the playerId, triggering the turnRef response handler
     * which calls the SWITCH_TURN callback to notify players
     */
    this.switchTurn = function(playerId) {
        if(distributed) {
            turnRef.set(playerId, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {/* no callback on good data set op */}
            });
        }
        else { // test or single player
            $timeout(function() {
                angular.forEach(callbacks[callbackName.SWITCH_TURN], function(fn) {
                    // later can make random start chance with opponent
                    fn.call(Game, Game.messages.OPPONENTS_TURN);
                });
            }, 500);

            $timeout(function() {
                angular.forEach(callbacks[callbackName.SWITCH_TURN], function(fn) {
                    // later can make random start chance with opponent
                    fn.call(Game, Game.messages.YOUR_TURN);
                });
            }, 1000);
        }
    }

    /**
     * fireShot
     *
     * Called by player to fire a shot at an opponent's board.
     * Parameters are the row and col of the shot.
     * Returns a deferred that resolves to the results of the shot.
     * responseRef.on fires shotDeferred
     * See respondToShot for response data format of defered.
     * Player is included to force new data into Firebase for the case where
     * shot was the same row and col and thus didn't updatate
     */
    this.fireShot = function(playerId, row, col) {
      var Game = this,
          deferred = $q.defer(),
          shotPos = {playerId: playerId, row: row, col: col};
      shotDeferred = deferred;
      if(distributed) {
          shotRef.set(shotPos, function(error) {
              if (error) {console.log('Shot data could not be saved.' + error);} 
              else {/* no callback on good data set op */}
          });
      }
      else { // test or single player
          $timeout(function() {
              var data = {row: row, col: col};
              angular.forEach(callbacks[callbackName.RECEIVE_SHOT], function(fn) {
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
     *
     * @params object shotResponse
     *
     * data format:
     *    { data: { messages: Game.messages},
     *            { gameOver: bool }
     *            { details: 
     *                  ship: {startCell: {row, col}, type: shipId, rotated: bool},
     *            }
     *    }
     */
    this.respondToShot = function(shotResponse) {
        if(distributed) {
            responseRef.set(shotResponse, function(error) {
                if (error) {console.log('Data could not be saved.' + error);} 
                else {/* no callback on good data set op */}
            });
        }
        else {
            shotDeferred.resolve(shotResponse);
        }
    };

    /**
     * getPlayer
     *
     * Retrieves players name from rootScope
     */
    this.getPlayer = function() {
        if(distributed) {return $rootScope.player;}
        else {return 'scott';} // TODO: remove when able
    };

    /**
     * getOpponent
     *
     * Retrieves opponents name from rootScope
     */
    this.getOpponent = function() {
        if(distributed) {return $rootScope.opponent;}
        else {return 'dennis';} // TODO: remove when able
    };

    /////////////////////////////////////
    // Firebase response handlers
    /////////////////////////////////////

    /**
     * turnRef.on
     *
     * recieves either a READY value or a players name
     * If the game is starting and the opponent isn't ready, a READY value is passed,
     * indicating that one player is now ready.
     * Otherwise a name is passed, the name is for the player whose turn it is 
     * This calls the registered SWITCH_TURN callback passing either YOUR_TURN or OPPONENTS_TURN
     *
     * Note: Distributed mode only
     */
    turnRef.on('value', function(turnData) {
        var turnStatus = turnData.val();
        if(!turnStatus){return;}
        if(turnStatus === gameState.READY) {
            opponentReady = true;
        }
        else { // Opponent is ready so start the game.
            var message;
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
    });

    /**
     * shotRef.on
     *
     * Recieve info about a shot (only if it is the opponents turn)
     * So this is for when the player is being shot by the opponent.
     * This calls the registered RECEIVE_SHOT callback passing shotInfo: {row: row, col: col}
     *
     * Note: Distributed mode only
     */
    shotRef.on('value', function(shotData) {
        var shotInfo = shotData.val();
        if(!shotInfo || playersTurn){return;}
        angular.forEach(callbacks[callbackName.RECEIVE_SHOT], function(fn) {
            fn.call(Game, shotInfo);
        });
    });

    /**
     * responseRef.on
     *
     * Recieve info about the results of a shot (only if it is the players turn)
     * So this is for when the player shoots and needs the results of the shot.
     *
     * Note: Distributed mode only
     */
    responseRef.on('value', function(responseData) {
        var shotResponse = responseData.val();
        if(!shotResponse || !playersTurn){return;}
        shotDeferred.resolve(shotResponse);
    });

  });
