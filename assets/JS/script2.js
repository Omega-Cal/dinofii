// START jQUERY FUNCTION
// ==============================
$(document).ready(function () {



    // ============================================================================================================
    // GET THE FEATURE CODE FROM THE VALUE OF THE OPTION SELECTED IN THE DROPDOWN LIST
    // ============================================================================================================

    // set variable to stand for the feature code of feature name selected from dropdown
    var featureCode;

    function getFeatureCode() {

        var fCode = $("form").serializeArray();

        featureCode = fCode[0].value;
    }

    $("select").on("change", getFeatureCode);



    // ============================================================================================================
    // GET LOCATIONS MATCHING FEATURE CODES FROM GEONAMES search SERVICE (1 credit, limit 2,000/hr, 30,000/mo)
    // ============================================================================================================


    function getFeatureName() {

        var geonamesSearchFeatures = "http://api.geonames.org/searchJSON?featureCode=" + featureCode + "&maxRows=1000&username=ghostfountain";

        $.ajax({
                url: geonamesSearchFeatures,
                method: "GET"
            })
            .then(function (response) {


                // array of random numbers of a certain length from a certain range
                var number = Math.min(response.totalResultsCount, 1000);
                var random = Array.from({
                    length: 2
                }, () => Math.floor(Math.random() * number));
                
                console.log(random);
                console.log(response);


                for (var i = 0; i < random.length; i++) {

                    var rando = random[i];

                    var card = {};

                    card.featureName = response.geonames[rando].name;
                    card.featureCountryCode = response.geonames[rando].countryCode;
                    card.featureLatitude = response.geonames[rando].lat;
                    card.featureLongitude = response.geonames[rando].lng;
                    card.featureLocation = response.geonames[rando].fclName;

                    if (response.geonames[rando].countryName) {

                        card.featureCountryName = response.geonames[rando].countryName;
                        console.log("DESTINATION: " + card.featureName + ", " + card.featureCountryName);

                    } else {

                        card.featureCountryName = "";
                        console.log("DESTINATION: " + card.featureName);

                }

                getPostalCodes(card);

                }
            });
    }




    // ==========================================================================================================
    // GET CLOSEST POSTAL CODE TO FEATURE LOCATION LAT+LONG COORDINATES FROM EZCMD API (limit 10,000 calls/month)
    // ==========================================================================================================


    function getPostalCodes(card) {

        var ezcmdPostalCodes = "https://ezcmd.com/apps/api_geo_postal_codes/nearby_locations_by_coords/866eaf56be3781d02011b80ebd0baef8/354?coords=" + card.featureLatitude + "," + card.featureLongitude + "&within=100&unit=Km";

        $.ajax({
                url: ezcmdPostalCodes,
                method: "GET"
            })
            .then(function (response) {

                console.log(response);

                if (response.search_results.length > 0) {

                    card.nearPlaceName = response.search_results[0].place_name.trim();
                    card.nearPlacePostalCode = response.search_results[0].postal_code;
                    card.nearPlaceCountryCode = response.search_results[0].country_code;
                    card.nearPlaceCountryName = response.search_results[0].country_name;
                    card.nearPlaceDistance = Math.round(response.search_results[0].distance * 10) / 10;

                    console.log("CLOSEST CITY: " + card.nearPlaceName + " " + card.nearPlaceCountryCode + " " + card.nearPlacePostalCode + " (" + card.nearPlaceDistance + " km)");

                    getHotspots(card);

                } else if (card.featureLocation) {

                    card.nearPlaceName = card.featureLocation;
                    card.nearPlacePostalCode = "";
                    card.nearPlaceCountryCode = "";
                    card.nearPlaceCountryName = "";
                    card.nearPlaceDistance = "?";

                    getHotspots(card);

                    console.log("CLOSEST CITY: (" + card.nearPlaceName + ")");

                    // return;
                } else {

                    getHotspots(card);

                    console.log("CLOSEST CITY: no info");
                    // return;
                }

            });
    }




    // =====================================================================================
    // GET # OF WIFI HOTSPOTS BY POSTAL CODE FROM WIGLE API (service is beta, no set limits)
    // =====================================================================================


    // mini function to format thousands of WiFi numbers to k format
    function kFormatter(num) {
        return num > 999 ? (num / 1000).toFixed(1) + 'k' : num
    }

    function getHotspots(card) {

        var wigleHotspots = "https://api.wigle.net/api/v2/stats/regions?country=" + card.nearPlaceCountryCode;

        card.nearPlaceWifi = "";

        // this API required sending its authentication name:token as a Basic Authorization HTTP header in Base64 ...
        // does that count as using a technology that we haven't discussed?
        $.ajax({
                headers: {
                    'Authorization': 'Basic ' + btoa('AID544c0365fdcc8c2463ec21d3590bbd23:8891f56fb22400d107dd8ee49d2798ff'),
                },
                url: wigleHotspots,
                method: "GET"
            })
            .then(function (response) {

                console.log(response);

                for (var k = 0; k < response.postalCode.length; k++) {

                    card.listPostalCode = response.postalCode[k].postalCode;
                    card.listHotSpots = kFormatter(response.postalCode[k].count);

                    if (card.listPostalCode === card.nearPlacePostalCode) {

                        card.nearPlaceWifi = card.listHotSpots;

                        console.log("WIFI: " + card.nearPlaceName + " " + card.nearPlacePostalCode + " " + card.nearPlaceCountryCode + " has " + card.nearPlaceWifi + " hotspots");

                    }
                }

                buildCard(card);

            });
    }

    // ============================================================================================================
    // END OF GLOBAL VARIABLES AND FUNCTIONS DECLARATIONS
    // ============================================================================================================


    // ============================================================================================================
    // APPLICATION'S TOP LEVEL FUNCTIONALITY: SET FEATURE TO SEARCH, and SEARCH BUTTON FUNCTION
    // ============================================================================================================

    $("#search_btn").on("click", function () {

        event.preventDefault();

        getFeatureName();
        playAudio();

    });

    var audio = document.getElementById("myAudio");

    function playAudio() {
        audio.play();
    }



    // ============================================================================================================
    // FUNCTION TO DYNAMICALLY BUILD A RESPONSE CARD FROM ALL RETURNED INFO
    // ============================================================================================================

    function buildCard(card) {


        $("#card_container").append("<div class='card border-dark mb-3'><div class='card-header p-2'><h5 style='display:inline;'>" + card.featureName + " : " + card.featureCountryName + "</h5><span class='font-weight-light' style='display:inline;float:right'><a href='https://www.google.com/maps/@" + card.featureLatitude + "," + card.featureLongitude + ",15z' target='_blank'>" + card.featureLatitude + ", " + card.featureLongitude + "</a></span></div><div class='card-body text-dark p-2'><span class='font-weight-light'>" + card.nearPlaceName + " " + card.nearPlaceCountryCode + " " + card.nearPlacePostalCode + " (" + card.nearPlaceDistance + " km)</span><a href='https://wigle.net/map?maplat=" + card.featureLatitude + "&maplon=" + card.featureLongitude + "&mapzoom=12&coloring=density' target='_blank'><i class='fas fa-globe float-right text-dark' style='margin-left:10px;padding-top:3px;'></i></a><i class='float-right fas fa-wifi' style='margin-left:10px;padding-top:3px;'></i><span class='float-right font-weight-bold'>" + card.nearPlaceWifi + "</span></div></div>");

    
    }

    // END jQUERY FUNCTION
});
// ==============================

