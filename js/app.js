var app = angular.module("burritoApp", ['ngRoute', 'firebase', 'flash', 'ngAnimate'])
    .controller('MainController', function($rootScope, $scope, $route, $routeParams, $location, $firebaseObject, $firebaseArray, $window, Flash) {
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
        var orderRef = new Firebase('https://bbfriday.firebaseio.com/orders/' + formatedDate);

        $scope.listUserBurritos = function() {
            $scope.userOrders = [];
            $scope.allTheOrders = [];
            $scope.flavors = {};
            $scope.totalBurritoOrders = 0;
            $scope.totalUserBurritoCount = 0;

            myOrderRef.on("value", function(snapshot) {
                snapshot.forEach(function(data) {
                    $scope.totalBurritoOrders += data.numChildren();
                });
            });

            orderRef.on("value", function(snapshot) {
                snapshot.forEach(function(order) {;
                    $scope.allTheOrders.push(order.val());
                    if (typeof $scope.flavors[order.val().flavor] == 'undefined')
                        $scope.flavors[order.val().flavor] = [];

                    $scope.flavors[order.val().flavor].push(order.val());
                    if (auth != null && order.val().uid === auth.uid) {
                        modifiedOrder = order.val();
                        modifiedOrder["id"] = order.key();
                        $scope.userOrders.push(modifiedOrder);
                        $scope.totalUserBurritoCount++;
                        if ($scope.totalUserBurritoCount < 10)
                            $scope.userAchievementMessage = "You are a Baby Burrito!"
                    }
                })
            });

        };





        $scope.deleteOrder = function(itemID) {
            var orderRef = new Firebase('https://bbfriday.firebaseio.com/orders/' + formatedDate + "/" + itemID);
            orderRef.remove();
            $scope.listUserBurritos();
        };


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
                    $scope.isLoggedIn = true;
                    $rootScope.userLoggedIn = true;
                    jQuery.ready();
                }
            });
        };

        /* Log the user out of his current account */
        $scope.logout = function() {
            myFireRef.unauth();
            Flash.create('warning', "See you soon " + auth.password.email, 'flash-message');
            $scope.isLoggedIn = false;
            $rootScope.userLoggedIn = false;
            $window.location.href = 'home.html';
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

        auth = myFireRef.getAuth();
        if (auth) {
            $scope.isLoggedIn = true;
            $rootScope.userLoggedIn = true;
        } else {
            $scope.isLoggedIn = false;
            $rootScope.userLoggedIn = false;
        }


        setInterval(function() {
            if ($scope.isLoggedIn == true) {
                if (!$(".user-order-list").hasClass("loading")) {
                    setTimeout(function() {
                        $(".user-order-list").addClass("loading");
                    }, 500);
                }
            }
        }, 1000);

        $scope.listUserBurritos();

    })
    .config(function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/home', {
                templateUrl: 'home.html',
            })
            .when('/profile', {
                templateUrl: 'profile.html',
            })
            .otherwise({
                redirectTo: '/home'
            });
    })
    .run(function($rootScope, $location) {
        $rootScope.$on("$routeChangeStart", function(event, next, current) {
            if (!$rootScope.userLoggedIn) {
                // not logged in, redirect to /home
                if (next.templateUrl === "profile.html") {
                    $location.path("/home");
                }
            }
        });
    });
