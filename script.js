console.log("i'm smokin ibm quantum computer");

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

// i want this to use the other stuff we've calculated to set the right bg color
function getBackgroundColor() {
  // i guess we should, before writing all the code for finding sunrise/sunset
  // times, work out how this should work.
}

function setTime() {
  let element = document.getElementById("time");
  let date = new Date(Date.now());
  let mins = date.getMinutes(); if (mins < 10) mins = `0` + mins;
  let hrs = date.getHours();
  if (hrs == 0) {
    hrs = 12;
    mins += ' am';
  } else if (hrs > 12) {
    hrs = hrs - 12;
    mins += ' pm';
  } else {
    mins += ' am';
  }
  console.log(date, hrs, mins);
  element.innerHTML = `it's ${hrs}:${mins}.`;
}

function setTemp() {
  // get keys from me secrets file (since this size project doesn't warrant/need a backend)
  fetch('config.json')
      .then((response) => response.json())
      .then(data => {
          const openweather = data.openweather;
      // get location from IP (could also be done with geolocation api)
      // https://ip-api.com/
      fetch ('http://ip-api.com/json')
          .then((response) => response.json())
          .then(data => {
              lat = data.lat;
              lon = data.lon;

              lat = 61.21;
              lon = -149.86;
              // now we use these values in a call to openweather
              ////const request = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweather}&units=imperial`;
              ////for now, use this sample response to not send tons of reqs to openweather
              const request = 'sample.json'
              fetch(request)
                  .then((response) => response.json())
                  .then((data) => {
                    data = data.openweather;
                    console.log(data);
                    // process JSON returned by openweather
                    // https://openweathermap.org/api/one-call-api
                      const city = data.name.toLowerCase();
                      const temp = Math.round(data.main.temp);
                      ////const fl = data.main.feels_like;
                      const tempElement = document.getElementById("temp");
                      const cityElement = document.getElementById("city");
                      tempElement.innerHTML = `${temp}°F out.`;
                      cityElement.innerHTML = `${city}`;
                  })
                  .catch(error => console.error('Couldn\'t get info from openweather:', error))
          })
          .catch(error => console.error('oops! no geolocation: ', error))
      })
      .catch(error => console.error('Couldn\'t load config.json:', error))
}

// update the time every 10 seconds
function updateTime() {
  setTimeout(setTime(), 10000);
}

// update the temp every 10 mins
function updateTemp() {
  setTimeout(setTemp(), 600000);
}

/*
store what colors we want for things like sunset, sunrise, midday, midnight
*/
// so is const more like just saying that 'this thing will always be this type' ?
// like, its value won't change, which sounds like how const is in other languages,
// but you're still able to use setters and stuff, so it's more like 'const x will
// always be a map' or something like that rather than 'const x will always have these
// special values in it' c'est la weak typing

/*
these are really just different stops of a gradient, based on the times of
certain events
*/
const colorMap = new Map();
colorMap.set('sunset',      [255, 48, 187]);
colorMap.set('bluehour',    [44, 48, 84]);
colorMap.set('midnight',    [38, 38, 38]);
colorMap.set('sunrise',     [255, 89, 0]);
colorMap.set('noon',        [123, 195, 255]);
colorMap.set('evil',        [255, 0, 0]);
colorMap.set('benevolent',  [123, 195, 255]);

// like the color map, but maps different named times to actual unix times
// these are fixed times so my development isn't reliant on the literal time of day

// these need to be circular, since every day follows basically the same loop
// i think i had a good idea before; check what the current unix timestamp is, then,
// any times before it (besides the last one since we're fading from it) get swapped
// for tomorrow's times.

const timeMap = new Map();
timeMap.set('sunset', 1738883460000);
let newdate = new Date(1738862443000);
console.log(newdate.toDateString());

function updateColors() {
  let color1 = colorMap.get('noon');
  let color2 = colorMap.get('sunset');

  // say, 30% past the first value. this means 30% the second, 70% the first
  // TODO: calculate this from time of day relative to
  let progress = 0.2;
  let red, green, blue;
  red = (progress * color2[0]) + ((1-progress)*color1[0]);
  green = (progress * color2[1]) + ((1-progress)*color1[1]);
  blue = (progress * color2[2]) + ((1-progress)*color1[2]);

  let newcolor = `rgb(${red}, ${green}, ${blue})`;
  console.log('aswedrf');
  document.body.style.background = newcolor;
  /*
  if (true)
    document.getElementById("city").style.color = newcolor;
  */
}

setTemp();
updateTime();
updateTemp();


console.log(getJulianDay());
console.log(getJulianCentury());

//document.body.style.background = '#dfd6c9';
let citystuff = document.getElementById("city");
updateColors();

//citystuff.style.color = "#fff";
//document.body.style.background = 'rgb(123, 195, 255)';
//document.body.style.color = '#fff';

/*
the sun will be highest at the midpoint between sunset and sunrise,
and simultaneously at its lowest at the other midpoint, no?
use these facts to assign points of transition.
*/

/*
 * i think that this should be structured like
 * 1. all the function defs at the top of the file (of course)
 * 2. a call to some 'init()' function that
 *   1. calcs sun rise/set times
 *   2. populates the color/time maps
 *     - this would get done based off of the rise/set times, so that
 *       part of course needs to get done first.
 * 3. calls the updateTemp(); and updateTime(); functions
 *
 *
 * i'm first going to figure out how to get the background color set
 * correctly, since that's the
 *
*/
/*
 * ok just had an idea. do things dually as a gradient between color,
 * and between alpha values. like, at night it doesn't make sense for
 * any color to be shining through the window, and the same at midday; it's just
 * white light coming through, but more brightly than at any other point. but
 * once it gets to, say, sunset, we can have golden light stream in that's also less
 * bright than midday sunshine. BANG
*/