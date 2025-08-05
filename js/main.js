// 1. DISPLAYS THE DATE AND TIME
function dateTime() {
	const date = new Date();
	let today = date.toDateString();
	let time = date.toLocaleTimeString();
	document.getElementById('date-time').innerHTML = '<p id="date">' + today + '</p><p id="time">' + time + '</p>';
	setTimeout(dateTime, 1000); // Refreshes the time every second
}

// 2. FETCHES AND DISPLAYS CURRENT WEATHER
function weatherBalloon(cityID) {
	var apiKey = '8b093586dd2c02084b20747b888d3cfa'; // Your OpenWeather API key
	fetch('https://api.openweathermap.org/data/2.5/weather?id=' + cityID + '&appid=' + apiKey)
		.then(function(resp) {
			return resp.json()
		})
		.then(function(data) {
			let weatherIcon = data.weather[0].icon;
			let tempK = parseFloat(data.main.temp);
			// Calculate temperature in Fahrenheit
			let tempF = Math.round((tempK - 273.15) * 1.8) + 32;

			document.getElementById('weather').innerHTML = '<p id="location">' + data.name + '</p><p id="details" ' + 'title="' + tempF + '&deg;F">' + '<img src="https://openweathermap.org/img/wn/' + weatherIcon + '.png">' + data.weather[0].description + '<span class="separator">|</span>' + tempF + '&deg;F</p>';
		});
}

// 3. FETCHES AND DISPLAYS NWS WEATHER ALERTS
/*function fetchWeatherAlert() {
    const alertContainer = document.getElementById('weather-alert');
    const forecastZone = 'SCZ106'; // NWS Zone for Anderson County, SC
    const apiUrl = `https://api.weather.gov/alerts/active/zone/${forecastZone}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                // If an alert is active, display it
                const alert = data.features[0].properties;
                alertContainer.innerHTML = `🚨 ${alert.headline}`;
                alertContainer.style.display = 'block';
                document.body.classList.add('alert-active');
            } else {
                // If no alerts, hide the banner
                alertContainer.style.display = 'none';
                document.body.classList.remove('alert-active');
            }
        })
        .catch(error => {
            console.error('Error fetching weather alert:', error);
            alertContainer.style.display = 'none';
            document.body.classList.remove('alert-active');
        });
}
*/
// 4. MAIN FUNCTION TO START EVERYTHING
function traichu() {
	// Start the date/time clock
	dateTime();
	
	// Get the current weather (using Anderson, SC city ID)
	weatherBalloon(4569298); 
	
	// Check for a weather alert immediately
	fetchWeatherAlert();
	
	// Set the alert to re-check every 10 minutes
	setInterval(fetchWeatherAlert, 600000); 
}


// To test the alert banner, you can temporarily replace the
// fetchWeatherAlert() function above with this one.
// Remember to change it back to get live alerts!
function fetchWeatherAlert() {
    const alertContainer = document.getElementById('weather-alert');
    const fakeHeadline = "TORNADO WARNING for this area until 2:30 PM EDT.";
    alertContainer.innerHTML = `🚨 ${fakeHeadline}`;
    alertContainer.style.display = 'block';
    document.body.classList.add('alert-active');
}
