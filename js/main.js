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

// Add this to your main.js file

// Weather API Configuration
const WEATHER_CONFIG = {
    API_KEY: '8b093586dd2c02084b20747b888d3cfa', // Replace with your OpenWeatherMap API key
    LAT: '34.5034', // Anderson, SC coordinates
    LON: '-82.6501',
    CACHE_DURATION: 30 * 60 * 1000 // 30 minutes cache
};

/**
 * Loads live weather data from OpenWeatherMap API
 */
async function loadWeatherData() {
    const cacheKey = 'weatherDataCache';
    
    try {
        // Check cache first
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < WEATHER_CONFIG.CACHE_DURATION) {
                console.log('Loading weather from cache');
                updateWeatherDisplay(data);
                return;
            }
        }

        console.log('Fetching fresh weather data...');
        
        // Fetch current weather and 5-day forecast
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${WEATHER_CONFIG.LAT}&lon=${WEATHER_CONFIG.LON}&appid=${WEATHER_CONFIG.API_KEY}&units=imperial`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${WEATHER_CONFIG.LAT}&lon=${WEATHER_CONFIG.LON}&appid=${WEATHER_CONFIG.API_KEY}&units=imperial`)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Weather API request failed');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        // Process the data
        const weatherData = processWeatherData(currentData, forecastData);
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
            data: weatherData,
            timestamp: Date.now()
        }));

        updateWeatherDisplay(weatherData);
        console.log('Weather data loaded and cached successfully!');

    } catch (error) {
        console.error('Error loading weather data:', error);
        
        // Show fallback display
        document.getElementById('current-temp').textContent = 'Weather unavailable';
        document.getElementById('weather-icon').src = 'https://openweathermap.org/img/w/01d.png';
        document.getElementById('current-location').textContent = 'Anderson, SC';
    }
}

/**
 * Processes raw API data into our display format
 */
function processWeatherData(currentData, forecastData) {
    // Current weather
    const current = {
        temp: Math.round(currentData.main.temp),
        icon: currentData.weather[0].icon,
        description: currentData.weather[0].description,
        location: `${currentData.name}, SC`
    };

    // Process 5-day forecast (API returns 3-hour intervals)
    const dailyForecasts = [];
    const processedDays = new Set();
    
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        // Skip if we already processed this day or if it's more than 5 days out
        if (processedDays.has(dayKey) || dailyForecasts.length >= 5) {
            return;
        }
        
        // Use noon forecast for daily temps (closest to 12:00 PM)
        const hour = date.getHours();
        if (hour >= 11 && hour <= 14) {
            processedDays.add(dayKey);
            
            const dayName = dailyForecasts.length === 0 ? 'Today' : 
                           date.toLocaleDateString('en-US', { weekday: 'short' });
            
            dailyForecasts.push({
                day: dayName,
                icon: item.weather[0].icon,
                high: Math.round(item.main.temp_max),
                low: Math.round(item.main.temp_min),
                description: item.weather[0].description
            });
        }
    });

    // Fill remaining days if needed (in case API doesn't have enough noon forecasts)
    while (dailyForecasts.length < 5 && forecastData.list.length > dailyForecasts.length * 8) {
        const item = forecastData.list[dailyForecasts.length * 8];
        const date = new Date(item.dt * 1000);
        const dayName = dailyForecasts.length === 0 ? 'Today' : 
                       date.toLocaleDateString('en-US', { weekday: 'short' });
        
        dailyForecasts.push({
            day: dayName,
            icon: item.weather[0].icon,
            high: Math.round(item.main.temp_max),
            low: Math.round(item.main.temp_min),
            description: item.weather[0].description
        });
    }

    return {
        current: current,
        forecast: dailyForecasts
    };
}

/**
 * Updates the weather display elements
 */
function updateWeatherDisplay(weatherData) {
    // Update current weather
    document.getElementById('current-temp').textContent = `${weatherData.current.temp}°F`;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/w/${weatherData.current.icon}.png`;
    document.getElementById('weather-icon').alt = weatherData.current.description;
    document.getElementById('current-location').textContent = weatherData.current.location;

    // Update forecast
    const forecastContainer = document.getElementById('forecast-days');
    forecastContainer.innerHTML = weatherData.forecast.map(day => `
        <div class="forecast-day">
            <span class="day-name">${day.day}</span>
            <img class="day-icon" src="https://openweathermap.org/img/w/${day.icon}.png" alt="${day.description}">
            <div class="temps">
                <span class="high-temp">${day.high}°</span>
                <span class="low-temp">${day.low}°</span>
            </div>
        </div>
    `).join('');
}

/**
 * Initialize weather widget (call this instead of initializeWeather in your HTML)
 */
function initializeWeatherWidget() {
    // Only load real data if API key is set
    if (WEATHER_CONFIG.API_KEY && WEATHER_CONFIG.API_KEY !== 'YOUR_API_KEY_HERE') {
        loadWeatherData();
        // Refresh weather data every hour
        setInterval(loadWeatherData, 60 * 60 * 1000);
    } else {
        // Show mock data if no API key
        console.log('No weather API key set, showing mock data');
        showMockWeatherData();
    }
}

/**
 * Shows mock weather data for testing
 */
function showMockWeatherData() {
    const mockData = {
        current: {
            temp: 72,
            icon: '01d',
            description: 'Clear sky',
            location: 'Anderson, SC'
        },
        forecast: [
            { day: 'Today', icon: '01d', high: 75, low: 55, description: 'Clear' },
            { day: 'Mon', icon: '02d', high: 78, low: 58, description: 'Partly cloudy' },
            { day: 'Tue', icon: '10d', high: 68, low: 45, description: 'Light rain' },
            { day: 'Wed', icon: '04d', high: 71, low: 50, description: 'Cloudy' },
            { day: 'Thu', icon: '01d', high: 76, low: 54, description: 'Clear' }
        ]
    };
    
    setTimeout(() => updateWeatherDisplay(mockData), 1000);
}

// Export functions if using modules, or just call directly
// Uncomment the line below and add your API key to WEATHER_CONFIG.API_KEY above
// initializeWeatherWidget();
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
