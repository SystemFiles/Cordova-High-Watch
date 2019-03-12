var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('DOMContentLoaded', function() {
            
            document.getElementById("searchCity").addEventListener("click", function() {
                
                
                
                var getURL = "https://511on.ca/api/v2/get/";
                var type = "cameras";
                var format = "json";

                var fullURL = getURL + type + "?format=" + format;
                
                app.sendRequest(fullURL, $("#search-form").find("#city").val());
            });
            
            document.getElementById("errorNoResult").addEventListener("click", function() {
                $(this).addClass("display-hidden");
            });
            
        }, false);
    },
    
    sendRequest: function(url, cityName) {
        const Http = new XMLHttpRequest();
        Http.open("GET", url);
        Http.send();
        
        Http.onreadystatechange=(e)=> {
            var root = JSON.parse(Http.responseText);
            
            if (!root || cityName.length == 0) {
                $("#errorNoResult").removeClass("display-hidden");
                return;
            } else {
                var filtered = root.filter(function(item) {
                    return item.Description.search(cityName) != -1;
                });
                
                var k = 0;
                
                console.log(filtered);
                console.log(filtered[k])
                
                if (!filtered || !filtered[k]) {
                    $("#errorNoResult").removeClass("display-hidden");
                    return;
                } else {

                    // Remove the info so we don't have duplicates.
                    $(".infoField").remove();

                    // Make the image visible and load the image in.
                    $("#trafficImage").removeClass("display-hidden");
                    $("#trafficImage").attr("src", filtered[k].Url);
                    var $data = "<p class='infoField'>"
                    + "ID: " + filtered[k].Id + "<br/>"
                    + "Name: " + filtered[k].Name + "<br/>"
                    + "City Name: " + filtered[k].CityName + "<br/>"
                    + "Road Name: " + filtered[k].RoadwayName + "<br/>"
                    + "Provided By: " + filtered[k].Organization + "</p>";

                    $("#trafficInfo").append($data);
                }
            }
        }
        
    }
};

app.initialize();