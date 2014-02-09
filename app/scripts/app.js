'use strict';

angular.module('ss14Team113App', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'lvl.directives.dragdrop'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/game', {
        templateUrl: 'views/game.html',
        controller: 'GameCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

jQuery.event.props.push('dataTransfer');
