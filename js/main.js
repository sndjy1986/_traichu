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
// TEMPORARY TEST FUNCTION
function fetchWeatherAlert() {
    const alertContainer = document.getElementById('weather-alert');
    
    // --- We are creating a fake alert for testing ---
    const fakeHeadline = "TORNADO WARNING for this area until 2:30 PM EDT.";
    
    // --- This part displays the fake alert ---
    alertContainer.innerHTML = `🚨 ${fakeHeadline}`;
    alertContainer.style.display = 'block';
    document.body.classList.add('alert-active');
    console.log("TESTING: Displaying a fake weather alert.");
}

// Initial check when page loads
fetchWeatherAlert();

// You can comment out the setInterval for testing if you want
// setInterval(fetchWeatherAlert, 600000);
