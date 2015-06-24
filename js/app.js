var app = angular.module("burritoApp", ['ngRoute', 'firebase', 'flash', 'ngAnimate']);

app.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        templateUrl: 'templates/home.html',
        controller: 'MainController'
    });

    // route for the profile page
    $routeProvider.when('/profile', {
        templateUrl: 'templates/profile.html',
        controller: 'MainController'
    });
    $routeProvider.otherwise({
        redirectTo: '/'
    });
});


app.controller('MainController', function($scope, $route, $routeParams, $location, $timeout, $firebaseObject, $firebaseArray, $window, Flash) {
    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;
    $scope.auth = false;
    //Our firebase references
    var myFireRef = new Firebase('https://bbfriday.firebaseio.com/');
    var myOrderRef = new Firebase('https://bbfriday.firebaseio.com/orders');
    var myUserRef = new Firebase('https://bbfriday.firebaseio.com/users');

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

    //    console.log($firebaseObject(orderRef));

    /* List the user's burritos as well as the total number of burritos. */
    $scope.listUserBurritos = function() {

        $scope.userOrders = [];
        $scope.allTheOrders = [];
        $scope.flavors = {};

        $scope.totalUserBurritoCount = 0;
        $scope.totalBurritoOrders = 0;
        $scope.userAchievementMessage = "";
        // Counts the total number of orders
        myOrderRef.on("value", function(snapshot) {
            snapshot.forEach(function(data) {
                $scope.totalBurritoOrders += data.numChildren();
            });
        });
        // Current Friday orders and user orders

        orderRef.on("value", function(snapshot) {
            snapshot.forEach(function(order) {
                $scope.allTheOrders.push(order.val());

                if (typeof $scope.flavors[order.val().flavor] == 'undefined')
                    $scope.flavors[order.val().flavor] = [];

                $scope.flavors[order.val().flavor].push(order.val());
                if ($scope.auth != null && order.val().uid === $scope.auth.uid) {
                    modifiedOrder = order.val();
                    modifiedOrder["id"] = order.key();
                    $scope.userOrders.push(modifiedOrder);
                    $scope.totalUserBurritoCount++;
                }
                if ($scope.totalUserBurritoCount < 10 || $scope.totalUserBurritoCount ==)
                    $scope.userAchievementMessage = "Can't you order more?"

            });
        });
    };




    /* Deletes a specific user order */
    $scope.deleteOrder = function(itemID) {
        var orderRef = new Firebase('https://bbfriday.firebaseio.com/orders/' + formatedDate + "/" + itemID);
        orderRef.remove();
        $scope.listUserBurritos();
    };


    $scope.confirmOrderMessage = function(burritoFlavor) {
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
        $scope.confirmOrderMessage(burritoFlavor);
    };

    /* Prepare Firebase query */
    $scope.order = function(id) {
        $scope.addToOrder(id, formatedDate, $scope.auth.uid);
    };

    /* Adds user specific data to Firebase /users */
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
                $scope.auth = myFireRef.getAuth();
                console.log($scope.auth ? true : false);
                $route.reload();
            }
        });
    };

    /* Log the user out of his current account */
    $scope.logout = function() {
        myFireRef.unauth();
        Flash.create('warning', "See you soon " + $scope.auth.password.email, 'flash-message');
        $scope.auth = null;
        console.log($scope.auth);
        $location.path('/');
        $route.reload();
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

    /* Allows the user to change the password if needed */
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


    $scope.auth = myFireRef.getAuth();
    //Not a nice solution

    setInterval(function() {
        $timeout(function() {
            $scope.listUserBurritos();
        }, 500);
    }, 1000);
    setInterval(function() {
        if ($scope.auth) {
            if (!$(".user-order-list").hasClass("loading")) {
                setTimeout(function() {
                    $(".user-order-list").addClass("loading");
                }, 500);
            }
        }
    }, 1000);

});
