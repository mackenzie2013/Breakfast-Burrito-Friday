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

    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";

    var currentFriday = today.getDate() - today.getDay() + 5; // as a day number in the month
    var thisFriday = new Date(); // This variable will contain the entire date of this friday

    thisFriday.setDate(currentFriday);
    formatedDate = thisFriday.getFullYear() + "-" + ("0" + (thisFriday.getMonth() + 1)).slice(-2) + "-" + thisFriday.getUTCDate();

    $scope.incomingFriday = weekday[thisFriday.getDay()] + ", " + month[thisFriday.getMonth()] + " " + thisFriday.getUTCDate();

    $scope.listUserBurritos = function() {
        $scope.NumberOfCheeseOrdered = 0;
        $scope.NumberOfBaconOrdered = 0;
        $scope.NumberOfSausageOrdered = 0;
        $scope.NumberOfChorizoOrdered = 0;
        $scope.userOrders = [];
        var once = 0;
        var list = $firebaseArray(new Firebase('https://bbfriday.firebaseio.com/orders/' + formatedDate));
        /* Wait for async call to finish */
        list.$loaded().then(function() {
            list.forEach(function(data) {
                if (data.flavor == "Cheese") {
                    $scope.NumberOfCheeseOrdered++;
                } else if (data.flavor == "Chorizo") {
                    $scope.NumberOfChorizoOrdered++;
                } else if (data.flavor == "Bacon") {
                    $scope.NumberOfBaconOrdered++;
                } else {
                    $scope.NumberOfSausageOrdered++;
                }
                if (auth != null && data.uid === auth.uid) {
                    $scope.userOrders.push(data);
                }
            });
        });
    };

    $scope.totalBurritosOrdered = function() {
        myOrderRef.on("value", function(snapshot) {
            $scope.totalBurritoOrders = 0;
            snapshot.forEach(function(data) {
                data.forEach(function(data) {
                    $scope.totalBurritoOrders++;
                });
            });
        });
    };
    
    $scope.totalBurritosOrdered();
    $scope.listUserBurritos();

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
        $scope.addToOrder(id, formatedDate, auth.uid);
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
                jQuery.ready();
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



    /* Check user's session state */
    var auth = myFireRef.getAuth();
    setTimeout(function() {
        auth = myFireRef.getAuth();
        if (auth) {
            $scope.isLoggedIn = true;
            $scope.listUserBurritos();
        } else {
            $scope.isLoggedIn = false;
        }

    }, 100);


    setInterval(function() {
        if ($scope.isLoggedIn == true) {
            $scope.listUserBurritos();
        }
    }, 5000);

    setInterval(function() {

        if ($scope.isLoggedIn == true) {
            if (!$(".user-order-list").hasClass("loading")) {
                setTimeout(function() {
                    $(".user-order-list").addClass("loading");
                }, 500);
            }
        }
    }, 1000);


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
