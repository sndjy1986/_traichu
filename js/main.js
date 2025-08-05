/**
 * 1. DISPLAYS THE DATE AND TIME
 * This function updates the clock every second.
 */
function dateTime() {
    const date = new Date();
    const today = date.toDateString();
    const time = date.toLocaleTimeString();
    document.getElementById('date-time').innerHTML = `<p id="date">${today}</p><p id="time">${time}</p>`;
    setTimeout(dateTime, 1000);
}

/**
 * 2. FETCHES AND DISPLAYS CURRENT WEATHER
 * This function gets the weather from OpenWeatherMap for your city.
 */
function weatherBalloon(cityID) {
    const apiKey = '8b093586dd2c02084b20747b888d3cfa'; // Your OpenWeather API key
    fetch(`https://api.openweathermap.org/data/2.5/weather?id=${cityID}&appid=${apiKey}`)
        .then(resp => resp.json())
        .then(data => {
            const weatherIcon = data.weather[0].icon;
            const tempK = parseFloat(data.main.temp);
            // Calculate temperature in Fahrenheit
            const tempF = Math.round((tempK - 273.15) * 1.8) + 32;

            document.getElementById('weather').innerHTML =
                `<p id="location">${data.name}</p>` +
                `<p id="details" title="${tempF}&deg;F">` +
                `<img src="https://openweathermap.org/img/wn/${weatherIcon}.png">${data.weather[0].description}` +
                `<span class="separator">|</span>${tempF}&deg;F</p>`;
        })
        .catch(error => console.error('Error fetching OpenWeatherMap data:', error));
}

/**
 * 3. FETCHES AND DISPLAYS LIVE NWS WEATHER ALERTS
 * This function connects to the NWS API for real-time alerts.
 */
function fetchWeatherAlert() {
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
                // If no alerts, make sure the banner is hidden
                alertContainer.style.display = 'none';
                document.body.classList.remove('alert-active');
            }
        })
        .catch(error => {
            console.error('Error fetching NWS weather alert:', error);
            // Also hide the banner if the API call fails
            alertContainer.style.display = 'none';
            document.body.classList.remove('alert-active');
        });
}

/**
 * 4. MAIN FUNCTION TO INITIALIZE THE PAGE
 * This function runs all the startup tasks.
 */
function initializeApp() {
    dateTime();
    weatherBalloon(4569298); // Anderson, SC city ID
    
    // Check for a weather alert immediately on load
    fetchWeatherAlert();
    
    // Set the alert to re-check every 10 minutes (600,000 milliseconds)
    setInterval(fetchWeatherAlert, 600000); 
}

// This line waits for the HTML to be fully loaded, then runs the app.
document.addEventListener('DOMContentLoaded', initializeApp);
