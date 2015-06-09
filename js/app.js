var app = angular.module("burritoApp", ['ngRoute', 'firebase', 'flash', 'ngAnimate'])

.controller('MainController', function($scope, $route, $routeParams, $location, $firebaseObject, Flash) {
    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;

    var myFireRef = new Firebase('https://bbfriday.firebaseio.com/');
    var myOrderRef = new Firebase('https://bbfriday.firebaseio.com/orders');
    // download the data into a local object
    $scope.orders = $firebaseObject(myOrderRef);
    $scope.isLoggedIn = false;

    /* Function called when user clicks "Make me a user" */
    $scope.createUser = function(newUser) {
        myFireRef.createUser({
            email: newUser.email,
            password: newUser.password
        }, function(error, userData) {
            if (error) {
                var err = error.message;
                Flash.create('warning', err);

            } else {
                console.log("Successfully created user account with uid:", userData.uid);
                var success = "You have successfully signed up! Welcome" + email;
                Flash.create('success', success);
            }
        });
    };

    /* Function called when user clicks login button */
    $scope.login = function(newUser) {
        myFireRef.authWithPassword({
            email: newUser.email,
            password: newUser.password
        }, function(error, authData) {
            if (error) {
                var err = "Incorrect email/password";
                Flash.create('warning', err, 'flash-message');
            } else {
                var success = "You have successfully logged in!";
                Flash.create('success', success, 'flash-message');
                $scope.isLoggedIn = true;
            }
        });
    };

    $scope.logout = function() {
        myFireRef.unauth();
        $scope.isLoggedIn = false;
         Flash.create('success', "You have logged out!");
    };

    /* Check user's session state */
    var authData = myFireRef.getAuth();

    if (authData) {
        $scope.isLoggedIn = true;
        console.log("Logged in as:", authData.password.email);
    } else {
        console.log("Logged out");
        $scope.isLoggedIn = false;
    }



})

.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'login.html'
        })
        .when('/signup', {
            templateUrl: 'signup.html'
        })
        .when('/home', {
            templateUrl: 'home.html',
            controller: 'HomeCtrl'
        })

});
