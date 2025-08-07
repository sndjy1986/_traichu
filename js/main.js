/**
 * 1. DISPLAYS THE DATE AND TIME
 * This function updates the time display to match the new HTML structure.
 */
function updateTime() {
    const now = new Date();
    const timeOptions = { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    };
    const dateOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    };
    
    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    
    // Update the new HTML structure
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    
    if (timeDisplay) timeDisplay.textContent = timeString;
    if (dateDisplay) dateDisplay.textContent = dateString;
}

// Weather API Configuration
const WEATHER_CONFIG = {
    API_KEY: '8b093586dd2c02084b20747b888d3cfa', // Your OpenWeatherMap API key
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
        const tempEl = document.getElementById('current-temp');
        const iconEl = document.getElementById('weather-icon');
        const locationEl = document.getElementById('current-location');
        
        if (tempEl) tempEl.textContent = 'Weather unavailable';
        if (iconEl) iconEl.src = 'https://openweathermap.org/img/w/01d.png';
        if (locationEl) locationEl.textContent = 'Anderson, SC';
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
    const tempEl = document.getElementById('current-temp');
    const iconEl = document.getElementById('weather-icon');
    const locationEl = document.getElementById('current-location');
    
    if (tempEl) tempEl.textContent = `${weatherData.current.temp}°F`;
    if (iconEl) {
        iconEl.src = `https://openweathermap.org/img/w/${weatherData.current.icon}.png`;
        iconEl.alt = weatherData.current.description;
    }
    if (locationEl) locationEl.textContent = weatherData.current.location;

    // Update forecast
    const forecastContainer = document.getElementById('forecast-days');
    if (forecastContainer) {
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
}

/**
 * Initialize weather widget
 */
function initializeWeatherWidget() {
    // Only load real data if API key is set
    if (WEATHER_CONFIG.API_KEY && WEATHER_CONFIG.API_KEY !== '8b093586dd2c02084b20747b888d3cfa') {
        loadWeatherData();
        // Refresh weather data every hour
        setInterval(loadWeatherData, 60 * 60 * 1000);
    } else {
        console.log('No weather API key set');
    }
}

/**
 * FETCHES AND DISPLAYS LIVE NWS WEATHER ALERTS
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
            if (alertContainer) {
                alertContainer.style.display = 'none';
                document.body.classList.remove('alert-active');
            }
        });
}

/**
 * MAIN FUNCTION TO INITIALIZE THE PAGE
 */
function initializeApp() {
    // Start time updates
    updateTime();
    setInterval(updateTime, 1000);
    
    // Initialize weather widget
    initializeWeatherWidget();
    
    // Check for weather alerts
    fetchWeatherAlert();
    setInterval(fetchWeatherAlert, 600000); // Every 10 minutes
}

// Wait for HTML to be loaded, then run the app
document.addEventListener('DOMContentLoaded', initializeApp);
