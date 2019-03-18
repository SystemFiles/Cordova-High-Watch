var app = {
    
    // Application Constructor
    initialize: function() {
        // Handles page navigation (For different views)
        document.addEventListener('init', function(event) {
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
                  switch (page.data.searchType) {
                      case "uid":
                          app.searchUID(page.data.searchTerm).then(function(result){
                              list = result;
                              app.buildResultList(list); // Build list of results and display them
                          });
                          break;
                      case "road_name":
                          app.searchRoadName(page.data.searchTerm).then(function(result){
                              list = result;
                              app.buildResultList(list); // Build list of results and display them
                          });
                          break;
                      case "city_name":
                          app.searchCityName(page.data.searchTerm).then(function(result){
                              list = result;
                              app.buildResultList(list); // Build list of results and display them
                          });
                          break;
                      default:
                          ons.notification.alert("Invalid Search Type...Cannot find anything!");
                  }
                
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
                        + "Provided By: " + result.org + "</p>";

                      $("#trafficInfo").append($data);
                      
                      var $saveBtn = "<ons-button id='save-button' modifier='Material'>Save this Location!</ons-button>";
                      
                      // Add the save button to the page.
                      $("ons-card").first().after($saveBtn);
                      
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
              }
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
    
    searchUID: function(uid) {
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
                        return item.Id.match(uid);
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
    
    searchRoadName: function(road_name) {
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

                    var cameras_road_name = httpResponse.filter(function (item) {
                        return item.Description.match(road_name);
                    });

                    var camList = [];
                    var numReturnedCams = cameras_road_name.length;

                    for (var i=0; i < numReturnedCams; i++) {
                        camList.push("[" + cameras_road_name[i].Id + "] " + cameras_road_name[i].Description);
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
    
    searchCityName: function(city_name) {
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

                    var cameras_city_name = httpResponse.filter(function (item) {
                        return item.CityName.match(city_name);
                    });

                    var camList = [];
                    var numReturnedCams = cameras_city_name.length;

                    for (var i=0; i < numReturnedCams; i++) {
                        camList.push("[" + cameras_city_name[i].Id + "] " + cameras_city_name[i].Description);
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
            var type = ["cameras", "roadconditions"];
            var format = "json";
            
            // Ideally loop through types to get all information, but in this case we just use cameras
            var fullUrl = getURL + type[0] + "?format=" + format;
            
            app.sendRequest(fullUrl).then(function(result) {
                
                var currentCam = result.filter(function(item) {
                    return item.Id === uid && item.Description === desc.trim();
                });
                
                // Need to use [0] index to find the first appearance because apparently, the 511on API returns cameras that have the EXACT SAME ID!!
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
                        name: currentCam[0].Name
                    }
                );
            });
        });
    }
};

app.initialize();
