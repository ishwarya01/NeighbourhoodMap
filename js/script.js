var isMenuVisible = false;
$("#menu").click(function() {
    if(!isMenuVisible) {
        isMenuVisible = true;
        $("#searchSection").removeClass("hide");
        $("#searchSection").addClass("show");
    } else {
        isMenuVisible = false;
        $("#searchSection").removeClass("show");
        $("#searchSection").addClass("hide");
    }
});

var map;
var infoWindow;
// Initialize the map
function initMap() {
    // Get the map object from google and set the center
    map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: 37.3657613, lng: -122.0263439},
        scrollwheel: true,
        zoom: 13,
        title: "Neighbourhood Map"
    });

    infoWindow = new google.maps.InfoWindow({
        content: ""
    });
}

    function googleError() {
    alert("error loading the map,something went wrong");
}

var markers = [];
initPlaces()
    .then(function(places) {
        initKnockout(places);
    })
    .catch(function(errorObj) {
        $("#mapWrapper").hide();
        alert("Some error happened. Please reload");
    });

// Query Foursquare API using a promise
function initPlaces() {
    return new Promise(function(resolve, reject) {
        var places = [];
        var url = "https://api.foursquare.com/v2/venues/search?query=park&ll=37.3657613,-122.0263439&client_id=540N2UYO3SXINU0TCI0PYIDX5Z5011RUOT44DNELWF4PFP5S&client_secret=GMNBLBPTDC2BTY1PUFKTKO2OE0BAHO10JTMJQIAU5DTB1KDU&v=20170919&limit=40";

        $.ajax({
            type: "get",
            datatype: "json",
            url: url,
            success: function(data) {
                var counter = 1;
                data.response.venues.forEach(function(venue) {
                    places.push({
                        lat: venue.location.lat,
                        lng: venue.location.lng,
                        name: venue.name,
                        address: venue.location.address ? venue.location.address : "No address available",
                        formattedAddress: getFormattedAddress(venue.location.formattedAddress),
                        id: counter
                    });
                    counter++;
                });

                resolve(places);
            },
            error: function(jqXHR, message, errorObj) {
                reject(errorObj);
            }
        });
    });
}

function getFormattedAddress(addressArray) {
    var result = "";
    if (addressArray > "" && addressArray instanceof Array) {
        addressArray.forEach(function addressPoint(address) {
            result = result + address + "\n";
        });
    }
    return result;
}

// Implemented knockout approach to filtered the places and display the list of items
function initKnockout(places) {
    var viewModel = {
        filter: ko.observable(""),
        nearByParks: ko.observableArray(places),
        showInfo: function () {
            var parkMarker = markers[this.id - 1];
            google.maps.event.trigger(parkMarker.marker, "click");
        }
    };

    viewModel.filteredItems = ko.computed(function() {
        var filter = this.filter().toLowerCase();
        if (!filter) {
            var nearByParks = this.nearByParks();
            if(markers.length === 0) {
                animateDropMarker(nearByParks);
            }else {
                markers.forEach(function(parksMarker){
                    parksMarker.marker.setVisible(true);
                });
            }
            return nearByParks;
        } else {
            var filteredParks = ko.utils.arrayFilter(this.nearByParks(), function(park) {
                return park.name.toLowerCase().indexOf(filter) !== -1;
            });

            markers.forEach(function(parkMarker) {
                var isParkFiltered = false;
                filteredParks.forEach(function(filteredpark) {
                   if(parkMarker.place === filteredpark) {
                       isParkFiltered = true;
                   }
                });

                if(isParkFiltered) {
                    parkMarker.marker.setVisible(true);
                } else {
                    parkMarker.marker.setVisible(false);
                }
            });

            return filteredParks;
        }
    }, viewModel);

    ko.applyBindings(viewModel);
}

// Animates dropping the marker
function animateDropMarker(markerArray) {
    clearMarkers();
    for (var i = 0; i < markerArray.length; i++) {
        addMarkerWithTimeout(markerArray[i], i * 100);
    }
}

// Clears the markers
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function addMarkerWithTimeout(place, timeout) {
    setTimeout(function() {
        var marker = new google.maps.Marker({
            position: {lat: place.lat, lng: place.lng},
            map: map,
            animation: google.maps.Animation.DROP
        });

        markers.push({
            marker: marker,
            place: place
        });

        marker.addListener("click", function () {
            window.setTimeout(function () {
                map.panTo(marker.getPosition());
            }, 1000);

            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){ marker.setAnimation(null); }, 1400);

            infoWindow.setContent("<b>" + place.name+ "</b>" + "<br>" + place.formattedAddress);
            infoWindow.open(map, marker);
        });

    }, timeout);
}
