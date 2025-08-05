function dateTime() {
	const date = new Date();
	let today = date.toDateString();
	let time = date.toLocaleTimeString();
	document.getElementById('date-time').innerHTML = '<p id="date">' + today + '</p><p id="time">' + time + '</p>';
	setTimeout(dateTime, 1000);
}

function weatherBalloon(cityID) {
	var apiKey = '8b093586dd2c02084b20747b888d3cfa'; //OpenWeather API key
	fetch('https://api.openweathermap.org/data/2.5/weather?id=' + cityID + '&appid=' + apiKey)
		.then(function(resp) {
			return resp.json()
		})
		.then(function(data) {
			let weatherIcon = data.weather[0].icon;
			let tempK = parseFloat(data.main.temp);
			// Calculate temperature in Fahrenheit
			let tempF = Math.round((tempK - 273.15) * 1.8) + 32;

			// Update the HTML to display only Fahrenheit
			document.getElementById('weather').innerHTML = '<p id="location">' + data.name + '</p><p id="details" ' + 'title="' + tempF + '&deg;F">' + '<img src="https://openweathermap.org/img/wn/' + weatherIcon + '.png">' + data.weather[0].description + '<span class="separator">|</span>' + tempF + '&deg;F</p>';
		});
}

function traichu() {
	dateTime();
	weatherBalloon(4569298); //OpenWeather city ID
}
// Add this new code at the end of your <script> block

function fetchWeatherAlert() {
    const alertContainer = document.getElementById('weather-alert');
    const forecastZone = 'SCZ106'; // NWS Zone for Anderson County, SC
    const apiUrl = `https://api.weather.gov/alerts/active/zone/${forecastZone}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                // Alert is active
                const alert = data.features[0].properties;
                const headline = alert.headline;
                const description = alert.description;
                
                // You can link to the full alert for more details
                const alertUrl = alert.id; 

                alertContainer.innerHTML = `🚨 ${headline}`;
                alertContainer.style.display = 'block';
                document.body.classList.add('alert-active');
                console.log(`Weather Alert: ${headline}`);
            } else {
                // No active alerts
                alertContainer.style.display = 'none';
                document.body.classList.remove('alert-active');
                console.log('No active weather alerts for your zone.');
            }
        })
        .catch(error => {
            console.error('Error fetching weather alert:', error);
            // Hide alert banner on error to avoid confusion
            alertContainer.style.display = 'none';
            document.body.classList.remove('alert-active');
        });
}

// Initial check when page loads
fetchWeatherAlert();

// Re-check for alerts every 10 minutes (600,000 milliseconds)
setInterval(fetchWeatherAlert, 600000);
