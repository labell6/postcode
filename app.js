//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This Application calculates the direct distance between two            :::
//:::  specified postcodes.                                                   :::
//:::                                                                         :::
//:::                                                                         :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

var async = require('async');
var PostcodesIO = require('postcodesio-client');
var postcodes = new PostcodesIO();
var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve landing page to browser
app.get('/',function(req,res){
  res.sendfile("index.html");
});

// handle calc request by landing page
app.post('/calcdist',function(req,res){
  var frompc=req.body.source;
  var topc=req.body.dest;
  console.log("POST request: Calc Distance From "+frompc+" To "+topc);
  async.waterfall(
  [
    function(done) {
      var err = null;
      var ll = [];
      coord(frompc).catch(function(e){console.log("Originating Postcode: "+e)}).then(function(reslt){ll.push(reslt); done(err,ll);});
    },
    function(ll,done) {
      var err = null;
      coord(topc).catch(function(e){console.log("Destination Postcode: "+e)}).then(function(reslt){ll.push(reslt); done(err,ll);});
    }], 
    function(err, reslt) {var val=haversine(reslt);res.status(200).send('Distance = ' + val + ' km');console.log("Distance (km) : "+val);});
});

// start express web server
var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});

// determine uk longitude and latitude from postcodes.io
function coord(pcode) {
  return  new Promise((resolve, reject) => {
    postcodes.lookup(pcode, function (err, postcode) {
       if (err) reject (err); 
       if (!postcode) {reject ("Postcode not found"); return;}
       var LongLat = [postcode.longitude, postcode.latitude];
       resolve (LongLat);
    });
  })
}


// use haversine formula to determine the great-circle distance between two points on a sphere given their longitudes and latitudes.
// see https://en.wikipedia.org/wiki/Haversine_formula
function haversine(res) {

  Math.rads = function(degrees) {
       return degrees * Math.PI / 180;
  };

  var R = 6372.8;
  var dLat = Math.rads(res[1][1] - res[0][1]);
  var dLon = Math.rads(res[1][0] - res[0][0]);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(Math.rads(res[0][1])) * Math.cos(Math.rads(res[1][1])) * Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

