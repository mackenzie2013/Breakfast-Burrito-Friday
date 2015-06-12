var app = angular.module("burritoApp", ['ngRoute', 'firebase', 'flash', 'ngAnimate'])

.controller('MainController', function($scope, $route, $routeParams, $location, $firebaseObject, $firebaseArray, $window, Flash) {
    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;

    var myFireRef = new Firebase('https://bbfriday.firebaseio.com/');
    var myOrderRef = new Firebase('https://bbfriday.firebaseio.com/orders');
    var myUserRef = new Firebase('https://bbfriday.firebaseio.com/users');

    $scope.orders = $firebaseObject(myOrderRef);
    $scope.isLoggedIn = false;

    var today = new Date();
    var weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";

    var currentFriday = today.getDate() - today.getDay() + 5; // as a day number in the month
    var thisFriday = new Date(); // This variable will contain the entire date of this friday

    thisFriday.setDate(currentFriday);
    formatedDate = thisFriday.getFullYear() + "-" + ("0" + (thisFriday.getMonth() + 1)).slice(-2) + "-" + thisFriday.getUTCDate();

    $scope.listUserBurritos = function() {
        $scope.userOrders = [];
        var list = $firebaseArray(new Firebase('https://bbfriday.firebaseio.com/orders/' + formatedDate));
        /* Wait for async call to finish */
        list.$loaded().then(function() {
            list.forEach(function(data) {
                if (data.uid === auth.uid) {
                    $scope.userOrders.push(data);
                }
            });
        });
    };

    auth = myFireRef.getAuth();
    /* Check user's session state */
    if (auth) {
        $scope.isLoggedIn = true;
        $scope.listUserBurritos();
    } else {
        $scope.isLoggedIn = false;
    }


    $scope.confirmOrder = function(burritoFlavor) {
        var message = "Congratulations human! You ordered a " + burritoFlavor + " burrito!"
        Flash.create('success', message, "flash-message");
    };

    /* Add order to Firebase */
    $scope.addToOrder = function(burritoFlavor, formatedDate, userId) {
        var orderDate = new Date();
        myOrderRef.child(formatedDate).push({
            flavor: burritoFlavor,
            uid: userId,
            orderedDate: orderDate.toLocaleDateString() + " " + orderDate.toLocaleTimeString()
        });
        $scope.listUserBurritos();
        $scope.confirmOrder(burritoFlavor);
    }

    /* Prepare Firebase query */
    $scope.order = function(id) {

        if (weekday[today.getDay()] == "Friday") {
            $scope.addToOrder(id, weekday[today.getDay()], auth.uid);
        } else {
            $scope.addToOrder(id, formatedDate, auth.uid);
        }
    };


    $scope.addUserToFireBase = function(user, userInfo) {
        myUserRef.child(user.uid).set({
            name: userInfo.name
        });
    };

    /* Function called when user clicks "Make me a user"
     * creates user and logs in the newly created account */
    $scope.createUser = function(newUser) {
        myFireRef.createUser({
            name: newUser.name,
            email: newUser.email,
            password: newUser.password
        }, function(error, userData) {
            if (error) {
                var err = error.message;
                Flash.create('warning', err, 'flash-message');

            } else {
                var success = "You have successfully signed up! Welcome" + newUser.name;
                $scope.addUserToFireBase(userData, newUser);
                $scope.login(newUser);
                Flash.create('success', success, 'flash-message');
            }
        });
    };

    /* Function called when user clicks login button */
    $scope.login = function(newUser) {
        myFireRef.authWithPassword({
            email: newUser.email,
            password: newUser.password
        }, function(error, userData) {
            if (error) {
                var err = "Incorrect email/password";
                Flash.create('warning', err, 'flash-message');
            } else {
                var success = "You have successfully logged in!";
                Flash.create('success', success, 'flash-message');
                auth = myFireRef.getAuth();
                $scope.listUserBurritos();
                $scope.isLoggedIn = true;
            }
        });
    };

    /* Log the user out of his current account */
    $scope.logout = function() {
        myFireRef.unauth();
        $window.location.href = 'home.html';
        Flash.create('success', "See you soon " + auth.password.email, 'flash-message');
        $scope.isLoggedIn = false;
    };

    /* Retrieve password, sends an email to the user with a temporary password */
    $scope.retrievePassword = function(user) {
        myFireRef.resetPassword({
            email: user.email
        }, function(error) {
            if (error === null) {
                console.log("Password reset email sent successfully");
            } else {
                console.log("Error sending password reset email:", error);
            }
        });
    };

    $scope.changePassword = function(user) {
        myFireRef.changePassword({
            email: user.email,
            oldPassword: user.oldPassword,
            newPassword: user.newPassword
        }, function(error) {
            if (error) {
                switch (error.code) {
                    case "INVALID_PASSWORD":
                        Flash.create('danger', "The specified user account password is incorrect!", 'flash-message');
                        break;
                    case "INVALID_USER":
                        Flash.create('danger', "User email/account does not exist!", 'flash-message');
                        break;
                    default:
                        Flash.create('danger', "Error changing password!", 'flash-message');
                }
            } else {
                Flash.create('success', "User password changed successfully!", 'flash-message');
            }
        });
    };

    setInterval(function() {
        if ($scope.isLoggedIn === true)
            $scope.listUserBurritos();
    }, 5000);


})

.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'login.html'
        })
        .when('/profile', {
            templateUrl: 'profile.html'
        })
        .when('/signup', {
            templateUrl: 'signup.html'
        })
        .when('/home', {
            templateUrl: 'home.html',
            controller: 'HomeCtrl'
        })

});
