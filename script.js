console.log("uhhhh i'm smokin ibm quantum computer")

// this syntax is freaky (coming from C-style stuff)
fetch('config.json')
    .then((response) => response.json())
    .then(data => {
        const openweather = data.openweather;
    fetch ('http://ip-api.com/json')
        .then((response) => response.json())
        .then(data => {
            const lat = data.lat;
            const lon = data.lon;
            console.log("lat: " + lat);
            console.log("lon: " + lon);
            // so NOW we use these values in a call to openweather
            const request = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweather}&units=imperial`;
            fetch(request)
                .then((response) => response.json())
                .then((data) => {
                    console.log(data.main.temp);
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