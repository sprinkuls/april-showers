"use strict";

// convenient definitions in UNIX millis
const HOUR = 3600000;
const DAY = 86400000;

console.log("i'm smokin ibm quantum computer");
/********** variables that need to be used by the rest of the program **********/
// TODO: think about if this should all be condensed into one map
// TODO: also learn how objects work in JS (it seems like I just need to use JSON)
//       resources for such:
//         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer
//         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
//         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
//       I think part of my confusion was that I'm used to C-style stuff with structs, rather than just lists of properties
//       and values. Maybe I should make a factory function for these?
//         https://www.theodinproject.com/lessons/node-path-javascript-factory-functions-and-the-module-pattern

// TODO: i wonder if there's some way to, instead of just using more stops, define some sort of function to
//       describe the change in color from t1 to t2. like, define the 'progress' or weighting of one to the other
//       based on the distance. that way we could just define colors and functions, rather than stops?
//       might be needlessly complex, but worth looking in to.

const theMap = new Map();
theMap.set('midnight', {
  'r': 0,
  'g': 0,
  'b': 0,
  'a': 0.0,
  'time': 0, // this is the UNIX timestamp that this stop occurs at
  'nextstop': 'sunrise' // what the next stop is
});

theMap.set('sunset', {
  'r': 255,
  'g': 255,
  'b': 255,
  'a': 1.0,
  'time': 66400000 // this is the UNIX timestamp that this stop occurs at
});


/********** functions and etc **********/
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

/***** stuff specifically for calculating sunrise/sunset time *****/
// the unix epoch occured on julian day 2440587.5
// use the current unix time (from Date.now()) to find the number of days since then
// (the division converts ms to days)
// offset is the number of days from today (1 = tomorrow, -1 = yesterday, etc)
function getJulianDay(offset=0) {
  return 2440587.5 + ((Date.now()+(offset*DAY)) / (DAY));
}

// based on the start of the 21st century (2451545th julian day)
// and how far through the century we are.
// offset is the number of days from today (1 = tomorrow, -1 = yesterday, etc)
function getJulianCentury(offset=0) {
  let julianDay = getJulianDay(offset);
  return ((julianDay - 2451545) / 36525);
}

// implementation taken from https://gml.noaa.gov/grad/solcalc/calcdetails.html (from the spreadsheets)
// which itself credits the book "Astronomical Algorithms" by Jean Meeus
function getRiseSet(lat, long, offset=0) {
  //console.log(lat, long);
  // convenience
  let RAD = Math.PI/180;
  let DEG = 180/Math.PI;

  let sin = Math.sin;
  let cos = Math.cos;
  let tan = Math.tan;

  let asin = Math.asin;
  let acos = Math.acos;

  let JC = getJulianCentury();
  //console.log("julianCentury", JC);

  let geomMeanLongSun = (280.46646+JC*(36000.76983+JC*0.0003032)) % 360;
  //console.log("geomMeanLongSun", geomMeanLongSun);

  let geomMeanAnomSun = 357.52911+JC*(35999.05029-0.0001537*JC);
  //console.log("geomMeanAnomSun", geomMeanAnomSun);

  let eccentEarthOrbit = 0.016708634-JC*(0.000042037+0.0000001267*JC);
  //console.log("eccentEarthOrbit", eccentEarthOrbit);

  let sunEqOfCtr = sin(RAD*geomMeanAnomSun)*(1.914602-JC*(0.004817+0.000014*JC))+sin(RAD*2*geomMeanAnomSun)*(0.019993-0.000101*JC)+sin(RAD*3*geomMeanAnomSun)*0.000289;
  //console.log("sunEqOfCtr", sunEqOfCtr);

  let sunTrueLong = geomMeanLongSun+sunEqOfCtr;
  //console.log("sunTrueLong", sunTrueLong);

  let sunAppLong = sunTrueLong-0.00569-0.00478*sin(RAD*(125.04-1934.136*JC));
  //console.log("sunAppLong", sunAppLong);

  let meanObliqEcliptic = 23+(26+((21.448-JC*(46.815+JC*(0.00059-JC*0.001813))))/60)/60;
  //console.log("meanObliqEcliptic", meanObliqEcliptic);

  let obliqCorr = meanObliqEcliptic+0.00256*cos(RAD*125.04-1934.136*JC);
  //console.log("obliqCorr", obliqCorr);

  let sunDeclin = DEG*(asin(sin(RAD*obliqCorr)*sin(RAD*sunAppLong)));
  //console.log("sunDeclin", sunDeclin);

  let HAsunrise = DEG*(acos(cos(RAD*90.833)/(cos(RAD*lat)*cos(RAD*(sunDeclin)))-tan(RAD*(lat))*tan(RAD*(sunDeclin))));
  //console.log("HAsunrise", HAsunrise);

  let varY = tan(RAD*(obliqCorr/2))*tan(RAD*(obliqCorr/2));
  //console.log("varY", varY);

  // insane equation
  let eqOfTime = 4*DEG*(varY*sin(2*RAD*(geomMeanLongSun))-2*eccentEarthOrbit*sin(RAD*(geomMeanAnomSun))+
                 4*eccentEarthOrbit*varY*sin(RAD*(geomMeanAnomSun))*cos(2*RAD*(geomMeanLongSun))-0.5*
                 varY*varY*sin(4*RAD*(geomMeanLongSun))-1.25*eccentEarthOrbit*eccentEarthOrbit*sin(2*RAD*(geomMeanAnomSun)));
  //console.log("eqOfTime", eqOfTime);

  // divide by 60 since offset is given in minutes
  // multiply by -1 because this gives GMT - ${your time zone}
  let tzOffset = -(new Date()).getTimezoneOffset() / 60;
  //console.log("tzOffset", tzOffset);

  let solarNoon = (720-4*long-eqOfTime+tzOffset*60)/1440;
  //console.log("solarNoon", solarNoon);
  // this is basically the % progression through the day; a value of 0.5
  // means that solar noon is exactly at normal noon (12:00)
  // # of mins = 60 * 24
  // # of mins through the day
  let mins = solarNoon * (60 * 24);
  let hrs = Math.floor(mins/60);
  mins = Math.floor(mins % 60);
  //console.log("solar noon", hrs, mins);

  // how much the sunrise/sunset are offset from solar noon
  let solarOffset = HAsunrise*4/1440;
  let rise = solarNoon - solarOffset;
  let set = solarNoon + solarOffset;

  let today = new Date();
  //console.log("now: ", today.toString());
  today.setHours(0,0,0,0);

  let zzz = DAY * rise;
  let yyy = DAY * solarNoon;
  let xxx = DAY * set;

  let riseTime = (today.valueOf() + zzz);
  let noonTime = (today.valueOf() + yyy);
  let setTime = (today.valueOf() + xxx);

  return [riseTime, noonTime, setTime];
}

// convert some unix timestamp to HH:MM am/pm format
function UNIXtoHHMM(timestamp) {
  const date = new Date(timestamp);
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
  return `${hrs}:${mins}`;
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
  //console.log(date, hrs, mins);
  element.innerHTML = `it's ${hrs}:${mins}`;
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
// TODO: fundamental change here; don't make these the color of the sky, but
//       rather the color of light that might shine in through a window
// TODO: add alpha values
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

function updateColors() {
  let color1 = colorMap.get('noon');
  let color2 = colorMap.get('sunset');

  color1 = theMap.get('midnight');

  // say, 30% past the first value. this means 30% the second, 70% the first
  // TODO: calculate this the difference in timestamps.
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

//returns a JSON response from openweather
async function updateOW(request) {
  let response = await fetch(request);
  return response.json();
}

//returns the latitude/longitude
async function getLatLon() {
  let response = await fetch('http://ip-api.com/json');
  let json = await response.json();
  return([json.lat, json.lon]);
}

function resizeCanvas() {
  canvas = document.getElementById("canvas");
  canvas.height = document.documentElement.clientHeight;
  canvas.width = document.documentElement.clientWidth / 3;
}

//////////////////// where code executes ////////////////////

// blue
updateTime();

resizeCanvas();


// paint the town red
(async () => {
  const [lat, lon] = await getLatLon();

  // now that we have the lat/lon, there are really two different branches
  // that make up this program:
  // 1. most of the program (calc rise/set times, do colors, etc)
  // 2. just get the weather (relatively small part, set h/l and current temp)
  // both rely on the result of the lat/lon call, so no matter what everything needs to
  // wait for the result of that call.
  const [rise, noon, set] = getRiseSet(lat, lon);
  const [tmrwrise, tmrwnoon, tmrwset] = getRiseSet(lat, lon, 1);

  // not the real time for testing :P
  let curtime = Date.now()/*+ (4 * HOUR)*/;
  console.log(curtime);

  // night, past sunrise and an hr past sunset
  if (curtime > rise && curtime > (set + HOUR)) {
    document.getElementById("solar").innerHTML  = `sunset was at ${UNIXtoHHMM(set)}.`;
    document.getElementById("solar").innerHTML += `<br>`;
    document.getElementById("solar").innerHTML += `tmrw's sunrise is at ${UNIXtoHHMM(tmrwrise)}.`;

  // midday, more than an hour past sunrise
  } else if (curtime > (rise + HOUR)) {
    document.getElementById("solar").innerHTML  = `sunset is at ${UNIXtoHHMM(set)}.`;
    document.getElementById("solar").innerHTML += `<br>`;
    document.getElementById("solar").innerHTML += `tmrw's sunrise is at ${UNIXtoHHMM(tmrwrise)}.`;

  // morning, before/within an hr of sunrise
  } else {
    document.getElementById("solar").innerHTML  = `sunset is at ${UNIXtoHHMM(set)}.`;
    document.getElementById("solar").innerHTML += `<br>`;
    document.getElementById("solar").innerHTML += `sunrise is at ${UNIXtoHHMM(tmrwrise)}.`;
  }


  // draw some junk
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  // TODO: figure out how to make this be the size of the screen? idk maybe some callback
  // that runs on screen resize? who knows!!
  // ok its called a hook not a callback
  // https://stackoverflow.com/questions/641857/javascript-window-resize-event
  //canvas.width = 500;
  let gradient = ctx.createLinearGradient(0, canvas.height/2, canvas.width, canvas.height/2);
  //SAVE ME TEMPLATE STRINGS (why is this process so jank whatever)
  let tmpRGB = [255, 255, 255];
  let lights1 = `rgb(${tmpRGB[0]} ${tmpRGB[1]} ${tmpRGB[2]} / 0%)`
  let lights2 = `rgb(${tmpRGB[0]} ${tmpRGB[1]} ${tmpRGB[2]})`

  gradient.addColorStop(0, lights1)
  gradient.addColorStop(1, lights2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // if there's a real API key given, make a real request; otherwise, use the sample response
  let req, openweatherkey;
  /*
  openweatherkey = await fetch('keys.json');
  openweatherkey = await openweatherkey.json();
  openweatherkey = openweatherkey.openweather;
  */

  if (openweatherkey === undefined)
    req = 'openweather.json';
  else
    req = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${openweatherkey}&units=imperial`;

  // we kinda have to await the response of this because, like, what else are we gonna do?
  let owResponse = await updateOW(req);

  // docs: https://openweathermap.org/api/one-call-3
  document.getElementById("temp").innerHTML = `, and ${Math.round(owResponse.current.temp)}°F out.`;

  document.getElementById("highlow").innerHTML = `there's a low of ${Math.round(owResponse.daily[0].temp.min)}°,  high of ${Math.round(owResponse.daily[0].temp.max)}°`
})();

/*
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