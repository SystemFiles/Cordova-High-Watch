var app = {
    currentUser: null,
    loggedIn: false,
    
    // Application Constructor
    initialize: function() {
        // Event is after deviceready and library loaded...
        document.addEventListener('init', function(event) {
            // Handles page navigation (For different views)
            var navigator = document.querySelector('#navigator')
            var page = event.target;
            if (page.id === 'home') {
                // Search Page
                page.querySelector('ons-toolbar .center').innerHTML = 'High-Watch';
                page.querySelector('#search').addEventListener('click', function() {
                    var searchTerm = $("#searchInput").val();
                    var searchType = $("input[name='searchType']:checked").val();

                    navigator.pushPage('results.html', {data: {title: 'Results List', searchTerm: searchTerm, searchType: searchType}});
                });

                page.querySelector("#showSaved").addEventListener('click', function() {
                    navigator.pushPage('saved.html', {data: {title: 'Saved'}});
                });
                
                page.querySelector("#alert-btn").addEventListener('click', function() {
                    navigator.pushPage('alerts.html', {data: {title: 'Alerts / Notifications'}})
                });
                
                page.querySelector('#login-btn').addEventListener('click', function() {
                    // Store the current user data after logging in..
                    
                    if (!app.loggedIn) {
                        app.userLogin().then(function(result) {
                            $('#login-btn').find('span').first().replaceWith("<span class='fas fa-sign-out-alt'></span>");

                            app.loggedIn = true;
                            app.currentUser = result;
                            
                            ons.notification.alert("Thanks for signing in " +
                                                  app.currentUser.displayName + "!");
                        });
                    } else {
                        app.userLogout().then(function() {
                            app.loggedIn = false;
                            app.currentUser = null;
                            ons.notification.alert("Signed out successfully!");
                            
                            // Change the icon back to login button icon
                            $('#login-btn').find('span').first().replaceWith("<span class='fas fa-user'></span>");
                        }).catch(function() {
                            ons.notification.alert("Error attempting to sign out..");
                        });
                    }
                });

            } else if (page.id === 'results') {
                // Set view title
                page.querySelector('ons-toolbar .center').innerHTML = page.data.title;

                // Setup event handlers (using event delegation)
                $("#result-list").on('click', '.res-item' , function() {
                    navigator.pushPage('target.html', {
                        data: {
                            id: $(this).text().split(']')[0].slice(1),
                            title: $(this).text().split(']')[1],
                        }
                    });
                });

                // Prohibit blank searches (This will return the entire JSON response for everything in 511on DB
                if (page.data.searchTerm.length == 0) {
                    ons.notification.alert("Cannot find anything with that search term...");
                    return;
                }

                // List of results
                var list = [];

                // Start Searching and populate results list
                app.searchCategory(page.data.searchTerm,page.data.searchType).then(function(result){
                    list = result;
                    app.buildResultList(list); // Build list of results and display them
                });

            } else if (page.id === 'targetResult') {
                // The end page
                page.querySelector('ons-toolbar .center').innerHTML = page.data.title;

                app.getDataByUID(page.data.id, page.data.title).then(function(result) {
                    $("#camImage").attr('src', result.url);

                    var $data = "<p class='infoField'>"
                        + "ID: " + result.id + "<br/>"
                        + "Name: " + result.name + "<br/>"
                        + "City Name: " + result.city + "<br/>"
                        + "Road Name: " + result.desc + "<br/>"
                        + "Provided By: " + result.org + "<br/>"
                        + "Current Road Condition: " + result.condition + "<br/>"
                        + "Current Visibility: " + result.visibility + "<br/>"
                        + "Presence of driving snow?: " + result.drifting + 
                          "</p>";

                      $("#trafficInfo").append($data);
                      
                      var $saveBtn = "<ons-button id='save-button' modifier='Material'>Save this Location!</ons-button>";
                      
                      // Add the save button to the page.
                      $("ons-card").first().after($saveBtn);
                      
                      // Save the current location
                      $("#save-button").on('click', function() {
                          app.saveRoadToFirebase(result.id, result.desc).then(function(success) {
                              ons.notification.alert(success);
                              
                              $('#save-button').hide();
                          });
                      });
                      
                  }).catch(function() {
                      ons.notification.alert("Error processing the data...Try again later!");
                  });
                  
              } else if (page.id === 'saved') {
                  var list = ['HWY 403', 'Lincoln M. Alexander Pkwy.'];
                  page.querySelector('ons-toolbar .center').innerHTML = page.data.title;
                  
                  // Build list of results
                  var $listItems = "";
                  var numItems = list.length;
                  for (var i=0; i < numItems; i++) {
                      $listItems += "<ons-list-item class='res-item' modifier='chevron' tappable>" + list[i] + "</ons-list-item>";
                  }
                  $("#saved-list").append($listItems);
                  page.querySelector('ons-toolbar .center').innerHTML = page.data.title;
              } else if (page.id === 'alerts') {
                  // DO STUFF (GENERATE ALERTS LIST)
                  page.querySelector('ons-toolbar .center').innerHTML = page.data.title;
              }
        });
    },
    
    decodePolyline: function(encoded) {

        // array that holds the points

        var points=[ ]
        var index = 0, len = encoded.length;
        var lat = 0, lng = 0;
        while (index < len) {
            var b, shift = 0, result = 0;
            do {

                b = encoded.charAt(index++).charCodeAt(0) - 63;//finds ascii                                                                                    //and substract it by 63
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);


            var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            points.push({latitude:( lat / 1E5),longitude:( lng / 1E5)})

        }
        return points
    },

    inRange: function(x, y) {
        const allowable = 0.02;
        var sum = Math.abs(x - y);
        var allowed = ((allowable * -1 <= sum) && (sum <= allowable));
        return allowed;
    },

    coordinatesInRange: function(decodedPoly, comparison, roadCompare) {
        return new Promise(function(resolve, reject) {
            var length = decodedPoly.length; // Cache length

            // Perform search
            for (var i=0; i < length; i++) {
                if (
                    app.inRange(decodedPoly[i].latitude, comparison.latitude) == true &&
                    app.inRange(decodedPoly[i].longitude, comparison.longitude) == true
                ) {
                    resolve({res: true, road: roadCompare});
                }
            }
            resolve(false);
        });
    },

    findMatchingRoadConditions: function(jsonResult, lat, long) {
        return new Promise(function(resolve, reject) {
            var jsonLength = jsonResult.length;
            for (var i=0; i < jsonLength; i++) {
                // Decode and search through encoded polyline for road
                var decodedPoly = app.decodePolyline(jsonResult[i].EncodedPolyline);
                app.coordinatesInRange(decodedPoly, {
                    latitude: lat,
                    longitude: long
                }, jsonResult[i]).then(function(result) {
                    if (result.res == true) {
                        // If the camera is on the road, return conditions for road
                        resolve(
                            {
                                condition: result.road.Condition,
                                visibility: result.road.Visibility,
                                drifting: result.road.Drifting
                            }
                        );
                    }
                });
            }
        });
    },

    getRoadConditionsJSON: function() {
        return new Promise(function(resolve, reject) {
            var conditionURL = "https://511on.ca/api/v2/get/roadconditions?format=json";
            app.sendRequest(conditionURL).then(function(result) {
                resolve(result);
            }).catch(function(msg) {
                ons.notification.alert(msg);
            });
        });
    },

    sendRequest: function(url) {
        return new Promise(function(resolve, reject) {
            const Http = new XMLHttpRequest();
            Http.onerror = reject;
            Http.open("GET", url);
            Http.send();

            Http.onreadystatechange=(e)=> {
                if (Http.status == 200) {
                    var root = JSON.parse(Http.responseText);
                    resolve(root);
                }
            }
        });
    },

    searchCategory: function(searchterm, searchtype) {
        return new Promise(function(resolve, reject) {
            var getURL = "https://511on.ca/api/v2/get/";
            var type = "cameras";
            var format = "json";

            // Compile full URL for sending HTTP_GET Request to API 511on
            var fullURL = getURL + type + "?format=" + format;

            app.sendRequest(fullURL).then(function(httpResponse) {
                // Check if response is empty or not
                if (httpResponse && !(httpResponse.length == 0)) {
                    // If response is not empty, we try to filter the response using search parameters

                    var cameras_uid = httpResponse.filter(function (item) {
                        switch (searchtype) {
                            case "uid":
                                return item.Id.match(searchterm);
                            case "road_name":
                                return item.Description.match(searchterm);
                            case "city_name":
                                return item.CityName.match(searchterm);
                            default:
                                ons.notification.alert("Invalid Search Type...Cannot find anything!");
                        }
                        return item.Id.match(searchterm);
                    });

                    var camList = [];
                    var numReturnedCams = cameras_uid.length;

                    for (var i=0; i < numReturnedCams; i++) {
                        camList.push("[" + cameras_uid[i].Id + "] " + cameras_uid[i].Description);
                    }

                    resolve(camList); // Return the list of cameras
                } else {
                    ons.notification.alert("Retreived nothing from our datasource...Try again later.");

                    // On error return nothing
                    return null;
                }
            });
        });
    },

    buildResultList: function(list) {
        // Check if list is populated or not
        if (list != null && list.length >= 1 ) {
            var $listItems = "";
            var numItems = list.length;
            for (var i=0; i < numItems; i++) {
                $listItems += "<ons-list-item class='res-item' modifier='chevron' tappable>" + list[i] + "</ons-list-item>";
            }
            $("#result-list").append($listItems);
        } else  {
            ons.notification.alert("No results using that search term...");
        }
    },

    getDataByUID: function(uid, desc) {
        return new Promise(function(resolve, reject) {
            var getURL = "https://511on.ca/api/v2/get/";
            var type = "cameras";
            var format = "json";
            var fullUrl = getURL + type + "?format=" + format;

            app.sendRequest(fullUrl).then(function(result) {

                var currentCam = result.filter(function(item) {
                    return item.Id === uid && item.Description === desc.trim();
                });

                // Do search for auxillary information about road conditions
                app.getRoadConditionsJSON().then(function(resultJSON) {
                    app.findMatchingRoadConditions(resultJSON, currentCam[0].Latitude, currentCam[0].Longitude).then(function(conditions) {
                        console.log(conditions);
                        resolve(
                            {
                                id: currentCam[0].Id,
                                org: currentCam[0].Organization,
                                roadName: currentCam[0].RoadwayName,
                                lat: currentCam[0].Latitude,
                                long: currentCam[0].Longitude,
                                desc: currentCam[0].Description,
                                city: currentCam[0].CityName,
                                url: currentCam[0].Url,
                                name: currentCam[0].Name,
                                condition: conditions.condition[0],
                                visibility: conditions.visibility,
                                drifting: conditions.drifting
                            }
                        );
                    }).catch(function(msg) {
                        ons.notification.alert(msg);
                        // Event if the condition search fails we want to show the basic road information along with the picture.
                        resolve(
                            {
                                id: currentCam[0].Id,
                                org: currentCam[0].Organization,
                                roadName: currentCam[0].RoadwayName,
                                lat: currentCam[0].Latitude,
                                long: currentCam[0].Longitude,
                                desc: currentCam[0].Description,
                                city: currentCam[0].CityName,
                                url: currentCam[0].Url,
                                name: currentCam[0].Name,
                                condition: null,
                                visibility: null,
                                drifting: null
                            }
                        );
                    });
                });
            });
        });
    },

    saveRoadToFirebase: function(roadUID, roadName) {
        return new Promise(function(resolve, reject) {
            if (app.currentUser == null || app.loggedIn == false) {
                ons.notification.toast("This feature is only available to users who are logged in.", { timeout: 2000 });
                reject();
            }
            
            var newRoad = firebase.database().ref('users/' + app.currentUser.uid + '/saved/').child(roadUID);
            
            newRoad.set({
                roadID: roadUID,
                roadName: roadName
            });
            
            resolve("Successfully saved road to database!");
        });
    },
    
    userLogin: function() {
        return new Promise(function(resolve, reject) {
            // Firebase authentication provider
            const authProvider = new firebase.auth.GoogleAuthProvider();
            
            firebase.auth().signInWithRedirect(authProvider).then(function() {
              return firebase.auth().getRedirectResult();
            }).then(function(result) {
              var user = result.user;
              // send the data to caller
              resolve(user);
            }).catch(function(error) {
              // Handle Errors here.
              var errorCode = error.code;
              var errorMessage = error.message;
            });
        }); 
    },
    
    userLogout: function() {
        return new Promise(function(resolve, reject) {
            firebase.auth().signOut().then(function() {
                resolve();
            }).catch(function(error) {
                reject();
            });
        });
    }
};

app.initialize();