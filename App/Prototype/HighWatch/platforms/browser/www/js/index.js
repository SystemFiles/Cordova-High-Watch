var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('DOMContentLoaded', function() {
            var getURL = "https://511on.ca/api/v2/get/event?format=json";
            var params = [];
            
            // Add parameters we are using.
            params.push("DirectionOfTravel=Northbound");
            
            var fullGet = getURL;
            var length = params.length;
            for (var i=0; i < length; i++) {
                fullGet += "&" + params[i];
            }
            
            console.log("request to send: " + fullGet);
            
            app.sendRequest(fullGet);
            
        
        }, false);
    },
    
    sendRequest: function(url) {
        const Http = new XMLHttpRequest();
        
        Http.onreadystatechange=(e)=> {
            if (this.readyState == 4 && this.status == 200) {
                var root = JSON.parse(Http.responseText);

                console.log(root[0]);
            }
        }
        
        Http.open("GET", url);
        Http.send();
    }
};

app.initialize();