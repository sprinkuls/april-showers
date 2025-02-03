console.log("uhhhh i'm smokin ibm quantum computer")

function getLatLong() {
  let lat, long;
  fetch ('http://ip-api.com/json')
    .then((response) => response.json())
    .then(data => {
      lat = data.lat;
      long = data.lon;
      console.log('B');
      console.log(lat, long);
    }).catch(error => console.error('oops! no geolocation: ', error))
    return [lat, long];
}

function getLatLong2(callback) {
  let lat, long;
  fetch ('http://ip-api.com/json')
    .then((response) => response.json())
    .then(data => {
      lat = data.lat;
      long = data.lon;
      console.log('B');
      console.log(lat, long);
      let [rise, set] = callback(lat, long);
      console.log(rise, set);
    }).catch(error => console.error('oops! no geolocation: ', error))
}

// this syntax is freaky (coming from C-style stuff)
fetch('config.json')
    .then((response) => response.json())
    .then(data => {
        const openweather = data.openweather;
    fetch ('http://ip-api.com/json')
        .then((response) => response.json())
        .then(data => {
            lat = data.lat;
            lon = data.lon;
            // so NOW we use these values in a call to openweather
            const request = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweather}&units=imperial`;
            fetch(request)
                .then((response) => response.json())
                .then((data) => {
                    const city = data.name;
                    const temp = data.main.temp;
                    const fl = data.main.feels_like;
                    const elem = document.getElementById("weather");
                    elem.innerHTML = `you are in ${city}; it's ${temp}F out, and feels like ${fl}F.`;
                    elem.innerHTML += ' i know where you are :-)'
                })
                .catch(error => console.error('Couldn\'t get info from openweather:', error))
        })
        .catch(error => console.error('oops! no geolocation: ', error))
    })
    .catch(error => console.error('Couldn\'t load config.json:', error))
    //TODO: figure out if i'm catching these things right lol
/*
*/

// returns [sunrisetime, sunsettime]
// it also doesn't work!
function getRiseSetBAD(lat, long) {
  //TODO: change this back to ``new Date(Date.now());``
    //let x = new Date('March 24, 2017');
    let x = new Date(Date.now());
    let month = x.getMonth() + 1; // zero indexed kill yourself this isn't C
    let year = x.getFullYear();
    let day = x.getDate();
    let tzOffset = x.getTimezoneOffset() / 60;

    console.log(day, month, year);

  // shamelessly stolen from
  // https://edwilliams.org/sunrise_sunset_algorithm.htm
  // (which itself is taken from a 1990 almanac)

  // 1. first calculate the day of the year
  let N1 = Math.floor(275 * (month) / 9);
  let N2 = Math.floor((month + 9) / 12);
  let N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) /3 ));
  let N = N1 - (N2 * N3) + day - 30;

  console.log(N);
  // 2. convert the longitude to hour value and calculate an approximate time
  let lngHour = long / 15;
  console.log(lngHour);
  let riseT = N + ((6  - lngHour) / 24);
  let setT  = N + ((18 - lngHour) / 24);
  console.log("2. ", riseT, setT);

  // 3. calculate the Sun's mean anomaly
  let riseM = (0.9856 * riseT) - 3.289;
  let setM  = (0.9856 * setT) - 3.289;

  // 'in radians' i will hurt you. rc = radian conversion
  let rc = Math.PI/180;

  // 4. calculate the Sun's true longitude
  let riseL = riseM + (1.916 * Math.sin(rc*riseM)) + (0.02 * Math.sin(rc * 2 * riseM)) + 282.634;
  let setL = setM + (1.916 * Math.sin(rc*setM)) + (0.02 * Math.sin(rc * 2 * setM)) + 282.634;
  console.log("L: ", riseL, setL);

  // 5a. calculate the Sun's right ascension
  let riseRA = Math.atan(rc * 0.91764 * Math.tan(rc * riseL));
  let setRA = Math.atan(rc * 0.91764 * Math.tan(rc * setL));
  console.log("RA: ", riseRA, setRA);

  // 5b. right ascension value needs to be in the same quadrant as L
  let riseLquadrant = (Math.floor(riseL / 90)) * 90;
  let riseRAquadrant = (Math.floor(riseRA / 90)) * 90;
  riseRA = riseRA + (riseLquadrant - riseRAquadrant);

  let setLquadrant = (Math.floor(setL / 90)) * 90;
  let setRAquadrant = (Math.floor(setRA / 90)) * 90;
  setRA = setRA + (setLquadrant - setRAquadrant);

  // 5c. right ascension value needs to be converted into hours
  riseRA = riseRA / 15;
  setRA = setRA / 15;

  // 6. calculate the Sun's declination
  let riseSinDec = 0.39782 * Math.sin(rc * riseL);
  let riseCosDec = 0.39782 * Math.cos(rc * riseL);

  let setSinDec = 0.39782 * Math.sin(rc * setL);
  let setCosDec = 0.39782 * Math.cos(rc * setL);

  // 7a. calculate the Sun's local hour angle
  //	zenith:                Sun's zenith for sunrise/sunset
	//    offical      = 90 degrees 50'
	//    civil        = 96 degrees
	//    nautical     = 102 degrees
	//    astronomical = 108 degrees
  // i'm sure 'civil' is fine.
  const zenith = 96;

  let riseCosH = (Math.cos(rc * zenith) - (riseSinDec * Math.sin(rc * lat))) / (riseCosDec * Math.cos(rc * lat));
  let setCosH = (Math.cos(rc * zenith) - (setSinDec * Math.sin(rc * lat))) / (setCosDec * Math.cos(rc * lat));

  console.log(riseCosH); // just a REALLY basic and poor sanity check
  // TODO: Do something with this information.
  //	if (cosH >  1)
	//    the sun never rises on this location (on the specified date)
	//  if (cosH < -1)
	//    the sun never sets on this location (on the specified date)

  // 7b. finish calculating H and convert into hours
  let riseH = (360 - Math.acos(rc * riseCosH)) / 15;
  let setH =  (Math.acos(rc * setCosH)) / 15;

  // 8. calculate local mean time of rising/setting
  let riseTime = riseH + riseRA - (0.06571 * riseT) - 6.622;
  let setTime = setH + setRA - (0.06571 * setT) - 6.622;
  console.log(riseTime, setTime);
  // 9. adjust back to UTC
  let riseUT = riseTime - lngHour;
  let setUT = setTime - lngHour;
  // NOTE: UT potentially needs to be adjusted into the range [0,24) by adding/subtracting 24
  // TOOD: ^ implement this check
  console.log("rise, set in UTC", riseUT, setUT);

  // 10. convert UT value to local time zone of latitude/longitude
  return[riseUT + tzOffset, setUT + tzOffset];
}


/*
so we're always going to be in some day
i think the way we should do things is
1. get the current time / day
2. if (currenttime is before sunrise and sunset) then
    just show
cases:
  if currenttime is before sunrise and sunset
      then show both times
  if it's after today's sunrise and sunset
      then show tomorrow's sunrise and sunset
  if we're inbetween sunrise and sunset
      then say 'sunrise was at x:am; sunset is at y:pm'
*/

// the unix epoch occured on julian day 2440587.5
// use the current unix time (from Date.now()) to find the number of days since then
// (the division converts ms to days)
function getJulianDay() {
  return 2440587.5 + (Date.now() / (86400000));
}

// based on the start of the 21st century (2451545th julian day)
// and how far through the century we are.
function getJulianCentury() {
  var julianDay = 2440587.5 + (Date.now() / (86400000));
  return ((julianDay - 2451545) / 36525);
}

//  implementation taken from https://gml.noaa.gov/grad/solcalc/calcdetails.html
function getRiseSet(lat, long) {
  var julianCentury = getJulianCentury();
}

// we should really just use unix timestamps, right?
// time is fucked up
let sunrise = 6;

// i want this to use the other stuff we've calculated to set the right bg color
function getBackgroundColor() {
  // i guess we should, before writing all the code for finding sunrise/sunset
  // times, work out how this should work.
}

function setTime() {
  let element = document.getElementById("time");
  let date = new Date(Date.now());
  let hrs = date.getHours(); if (hrs == 0) hrs = 12; else if (hrs > 12) hrs = hrs - 12;
  let mins = date.getMinutes(); if (mins < 10) mins = `0` + mins;
  console.log(date, hrs, mins);
  element.innerHTML = `${hrs}:${mins}`;
}

function updateTime() {
  setTimeout(setTime(), 10000);
}
updateTime();

function updateTemp() {

} updateTemp();

console.log(getJulianDay());
console.log(getJulianCentury());

//let [ay, bee] = getLatLong();
//getLatLong2(getRiseSet);
//getRiseSet(lat, long);

/*
the sun will be highest at the midpoint between sunset and sunrise,
and simultaneously at its lowest at the other midpoint, no?
use these facts to assign points of transition.
*/
