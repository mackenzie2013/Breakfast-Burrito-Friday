var app = angular.module("burritoApp", ['ngRoute', 'firebase'])

.controller('MainController', function ($scope, $route, $routeParams, $location, $firebaseObject) {
    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;

    var myFireRef = new Firebase('https://bbfriday.firebaseio.com/');
    var myOrderRef = new Firebase('https://bbfriday.firebaseio.com/orders');

    // download the data into a local object
    $scope.orders = $firebaseObject(myOrderRef);

    $scope.createUser = function (newUser) {
        myFireRef.createUser({
            email: newUser.email,
            password: newUser.password
        }, function (error, userData) {
            if (error) {
                $scope.error = error.message;
                console.log(error.message);
            } else {
                console.log("Successfully created user account with uid:", userData.uid);
            }
        });
    };

})

 .config(function ($routeProvider, $locationProvider) {
     $routeProvider

 });