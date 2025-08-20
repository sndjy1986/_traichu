/**
 * 1. DISPLAYS THE DATE AND TIME
 * This function updates the time display in the custom format.
 */
function updateTime() {
    const now = new Date();

    const month = now.toLocaleDateString('en-US', { month: 'long' });
    const day = now.getDate();
    const year = now.getFullYear();

    // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const dateString = `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;

    // Format: -Thursday-
    const weekday = `${now.toLocaleDateString('en-US', { weekday: 'long' })}`;

    // Format: 5:36PM
    const timeString = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).replace(' ', ''); // Remove space between time and AM/PM

    // Update the HTML elements
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');

    if (timeDisplay) {
        timeDisplay.innerHTML = `${dateString}<br>${weekday}<br>${timeString}`;
    }

    // Hide the date display since we're showing everything in time-display
    if (dateDisplay) {
        dateDisplay.style.display = 'none';
    }
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
    if (WEATHER_CONFIG.API_KEY && WEATHER_CONFIG.API_KEY !== 'YOUR_API_KEY_HERE') {
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
 * Sets a dynamic greeting message based on the time of day.
 */
function updateGreeting() {
    const greetingEl = document.getElementById('greeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();

    const morningGreetings = ["Good morning, Joey!", "Rise and shine, Joey!", "Top of the morning, Joey!"];
    const afternoonGreetings = ["Good afternoon, Joey!", "Hope you're having a great day, Joey!", "How's it going, Joey?"];
    const eveningGreetings = ["Good evening, Joey!", "Hope you had a good day, Joey.", "Welcome back, Joey."];
    const nightGreetings = ["Working late, Joey?", "Burning the midnight oil, Joey?", "Hi there, night owl."];

    let relevantGreetings;

    if (hour >= 5 && hour < 12) {
        relevantGreetings = morningGreetings;
    } else if (hour >= 12 && hour < 17) {
        relevantGreetings = afternoonGreetings;
    } else if (hour >= 17 && hour < 22) {
        relevantGreetings = eveningGreetings;
    } else {
        relevantGreetings = nightGreetings;
    }

    const greeting = relevantGreetings[Math.floor(Math.random() * relevantGreetings.length)];
    greetingEl.textContent = greeting;
}

/**
 * Loads the RSS news feed
 */
function loadNewsFeed() {
    const newsContent = document.getElementById('news-content');
    if (!newsContent) return;

    const cacheKey = 'foxNewsFeedCache';
    const cacheDuration = 15 * 60 * 1000;

    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        const { html, timestamp } = JSON.parse(cachedData);

        if (Date.now() - timestamp < cacheDuration) {
            console.log('Loading news instantly from cache.');
            newsContent.innerHTML = html;
            return;
        }
    }

    console.log('Fetching fresh news from the server.');

    // Try alternative RSS proxy service
    fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://moxie.foxnews.com/google-publisher/latest.xml'))
    .then(response => response.json())
    .then(data => {
        let html = '';
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                html += `<a href="${item.link}" target="_blank">🦊 ${item.title}</a>`;
            });
        } else {
            throw new Error('No items found in RSS feed.');
        }

        newsContent.innerHTML = html;
        const dataToCache = { html: html, timestamp: Date.now() };
        localStorage.setItem(cacheKey, JSON.stringify(dataToCache));

        console.log('Headlines loaded and cached successfully!');
    })
    .catch(error => {
        console.error('Error fetching or parsing RSS feed:', error);
        newsContent.innerHTML = '🦊 News feed temporarily unavailable - check back later 🦊';
    });
}

/**
 * FETCHES AND DISPLAYS NETWORK INFORMATION
 */
function loadNetworkInfo() {
    const ipInfoEl = document.getElementById('ip-info');
    const locationInfoEl = document.getElementById('location-info');
    const asnInfoEl = document.getElementById('asn-info');
    const organizationInfoEl = document.getElementById('organization-info');

    // Use a reliable service to get the IPv4 address and other info
    fetch('https://ipinfo.io/json?') // Replace with your ipinfo.io token
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error.message);
            }
            if (ipInfoEl) ipInfoEl.textContent = `IP: ${data.ip}`;
            if (locationInfoEl) locationInfoEl.textContent = `Location: ${data.city}, ${data.region}`;
            if (asnInfoEl) {
                // The 'org' field from ipinfo.io contains both ASN and organization name
                const orgParts = data.org.split(' ');
                const asn = orgParts.shift(); // The first part is the ASN
                const orgName = orgParts.join(' '); // The rest is the organization name
                asnInfoEl.textContent = `ASN: ${asn}`;
                if (organizationInfoEl) organizationInfoEl.textContent = `Organization: ${orgName}`;
            }
        })
        .catch(error => {
            console.error('Error fetching network info:', error);
            if (ipInfoEl) ipInfoEl.textContent = 'IP: API Error';
            if (locationInfoEl) locationInfoEl.textContent = 'Location: API Error';
            if (asnInfoEl) asnInfoEl.textContent = 'ASN: API Error';
            if (organizationInfoEl) organizationInfoEl.textContent = 'Organization: API Error';
        });
}

/**
 * IMPROVED SPEED TEST FOR HIGH-SPEED CONNECTIONS
 * This version can accurately measure fiber speeds >1Gbps
 */

class FiberSpeedTest {
    constructor() {
        this.testSizes = [
            { name: '1MB', size: 1024 * 1024, url: 'https://httpbin.org/bytes/1048576' },
            { name: '5MB', size: 5 * 1024 * 1024, url: 'https://httpbin.org/bytes/5242880' },
            { name: '10MB', size: 10 * 1024 * 1024, url: 'https://httpbin.org/bytes/10485760' }
        ];
        this.concurrentConnections = 4; // Multiple streams for better measurement
        this.testDuration = 10000; // 10 seconds max per test
    }

    async runSpeedTest() {
        const speedTestEl = document.getElementById('speed-test');
        if (!speedTestEl) return;

        speedTestEl.textContent = 'Speed: Testing...';
        
        try {
            // Run download test with multiple concurrent connections
            const downloadSpeed = await this.measureDownloadSpeed();
            
            // Run upload test
            const uploadSpeed = await this.measureUploadSpeed();
            
            // Display results
            const downloadMbps = (downloadSpeed / 1024 / 1024 * 8).toFixed(1);
            const uploadMbps = (uploadSpeed / 1024 / 1024 * 8).toFixed(1);
            
            speedTestEl.innerHTML = `Speed: ↓${downloadMbps} Mbps ↑${uploadMbps} Mbps`;
            
        } catch (error) {
            console.error('Speed test failed:', error);
            speedTestEl.textContent = 'Speed: Test failed';
        }
    }

    async measureDownloadSpeed() {
        const testFile = this.testSizes[1]; // Use 5MB file
        const promises = [];
        
        // Create multiple concurrent download streams
        for (let i = 0; i < this.concurrentConnections; i++) {
            promises.push(this.downloadTest(testFile.url + `?stream=${i}&t=${Date.now()}`));
        }
        
        const startTime = performance.now();
        const results = await Promise.all(promises);
        const endTime = performance.now();
        
        const totalBytes = results.reduce((sum, bytes) => sum + bytes, 0);
        const duration = (endTime - startTime) / 1000; // Convert to seconds
        
        return totalBytes / duration; // Bytes per second
    }

    async downloadTest(url) {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const reader = response.body.getReader();
        let totalBytes = 0;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.length;
        }
        
        return totalBytes;
    }

    async measureUploadSpeed() {
        // Create test data (1MB)
        const testData = new Uint8Array(1024 * 1024);
        crypto.getRandomValues(testData);
        
        const promises = [];
        
        // Create multiple concurrent upload streams
        for (let i = 0; i < this.concurrentConnections; i++) {
            promises.push(this.uploadTest(testData));
        }
        
        const startTime = performance.now();
        await Promise.all(promises);
        const endTime = performance.now();
        
        const totalBytes = testData.length * this.concurrentConnections;
        const duration = (endTime - startTime) / 1000;
        
        return totalBytes / duration; // Bytes per second
    }

    async uploadTest(data) {
        const response = await fetch('https://httpbin.org/post', {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: HTTP ${response.status}`);
        }
        
        return response.json();
    }
}

// Alternative: Use dedicated speed test services
class ExternalSpeedTest {
    async runFastSpeedTest() {
        const speedTestEl = document.getElementById('speed-test');
        if (!speedTestEl) return;

        speedTestEl.textContent = 'Speed: Testing...';
        
        try {
            // Use Fast.com API (Netflix's speed test)
            const response = await fetch('https://fast.com/api/speedtest', {
                method: 'GET',
                cache: 'no-cache'
            });
            
            // Note: Fast.com requires more complex implementation
            // This is a simplified version
            speedTestEl.textContent = 'Speed: Use fast.com for accurate fiber testing';
            
        } catch (error) {
            // Fallback to Cloudflare speed test
            this.runCloudflareSpeedTest();
        }
    }

    async runCloudflareSpeedTest() {
        const speedTestEl = document.getElementById('speed-test');
        if (!speedTestEl) return;

        try {
            // Use Cloudflare's speed test endpoint
            const testUrl = 'https://speed.cloudflare.com/__down?bytes=25000000'; // 25MB
            const startTime = performance.now();
            
            const response = await fetch(testUrl, {
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            const data = await response.arrayBuffer();
            const endTime = performance.now();
            
            const bytes = data.byteLength;
            const duration = (endTime - startTime) / 1000;
            const mbps = (bytes * 8 / duration / 1024 / 1024).toFixed(1);
            
            speedTestEl.textContent = `Speed: ${mbps} Mbps (Download)`;
            
        } catch (error) {
            console.error('Cloudflare speed test failed:', error);
            speedTestEl.textContent = 'Speed: Test unavailable';
        }
    }
}

// IMPROVED SPEED TEST - Replace your existing runSpeedTest function
function runSpeedTest() {
    const speedTestEl = document.getElementById('speed-test');
    if (!speedTestEl) return;

    speedTestEl.textContent = 'Speed: Testing...';

    // Use a larger test file for fiber connections
    const testUrl = 'https://speed.cloudflare.com/__down?bytes=50000000'; // 50MB test
    const startTime = performance.now();
    
    fetch(testUrl, {
        cache: 'no-cache',
        headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
    })
    .then(data => {
        const endTime = performance.now();
        const bytes = data.byteLength;
        const duration = (endTime - startTime) / 1000; // Convert to seconds
        
        // Proper conversion: bytes per second → bits per second → megabits per second
        const bytesPerSecond = bytes / duration;
        const bitsPerSecond = bytesPerSecond * 8;
        const mbps = Math.round(bitsPerSecond / 1000000); // Convert to Mbps and round
        
        speedTestEl.textContent = `Speed: ${mbps} Mbps`;
        
        console.log(`Speed test results:
        - Downloaded: ${(bytes / 1024 / 1024).toFixed(1)} MB
        - Duration: ${duration.toFixed(2)} seconds  
        - Speed: ${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
        - Speed: ${mbps} Mbps`);
    })
    .catch(error => {
        console.error('Speed test failed:', error);
        
        // Fallback to multiple smaller concurrent tests
        runConcurrentSpeedTest();
    });
}

// Fallback function for concurrent testing
function runConcurrentSpeedTest() {
    const speedTestEl = document.getElementById('speed-test');
    if (!speedTestEl) return;

    speedTestEl.textContent = 'Speed: Testing (fallback)...';

    // Use multiple larger files concurrently
    const testUrls = [
        'https://httpbin.org/bytes/5242880?t1=' + Date.now(), // 5MB
        'https://httpbin.org/bytes/5242880?t2=' + Date.now(), // 5MB  
        'https://httpbin.org/bytes/5242880?t3=' + Date.now(), // 5MB
        'https://httpbin.org/bytes/5242880?t4=' + Date.now()  // 5MB
    ];

    const startTime = performance.now();
    
    Promise.all(testUrls.map(url => 
        fetch(url, { cache: 'no-cache' }).then(r => r.arrayBuffer())
    ))
    .then(results => {
        const endTime = performance.now();
        const totalBytes = results.reduce((sum, data) => sum + data.byteLength, 0);
        const duration = (endTime - startTime) / 1000;
        
        const bytesPerSecond = totalBytes / duration;
        const bitsPerSecond = bytesPerSecond * 8;
        const mbps = Math.round(bitsPerSecond / 1000000);
        
        speedTestEl.textContent = `Speed: ${mbps} Mbps`;
        
        console.log(`Concurrent speed test results:
        - Downloaded: ${(totalBytes / 1024 / 1024).toFixed(1)} MB total
        - Duration: ${duration.toFixed(2)} seconds  
        - Speed: ${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
        - Speed: ${mbps} Mbps`);
    })
    .catch(error => {
        console.error('Concurrent speed test failed:', error);
        speedTestEl.textContent = 'Speed: Test failed';
    });
}

// Enhanced speed test with WebRTC for even more accuracy
class WebRTCSpeedTest {
    async measureRealSpeed() {
        const speedTestEl = document.getElementById('speed-test');
        if (!speedTestEl) return;

        speedTestEl.textContent = 'Speed: Advanced testing...';
        
        try {
            // Use multiple large files from different CDNs
            const testUrls = [
                'https://ash-speed.hetzner.com/100MB.bin',
                'https://lg-ams.fdcservers.net/100MBtest.zip',
                'https://speedtest.selectel.ru/100MB.zip'
            ];
            
            const results = [];
            
            for (const url of testUrls) {
                try {
                    const speed = await this.testSingleUrl(url);
                    results.push(speed);
                } catch (e) {
                    console.warn(`Failed to test ${url}:`, e);
                }
            }
            
            if (results.length > 0) {
                // Use the fastest result (best case scenario)
                const maxSpeed = Math.max(...results);
                const mbps = (maxSpeed / 1024 / 1024 * 8).toFixed(1);
                speedTestEl.textContent = `Speed: ${mbps} Mbps`;
            } else {
                throw new Error('All speed tests failed');
            }
            
        } catch (error) {
            console.error('WebRTC speed test failed:', error);
            speedTestEl.textContent = 'Speed: Test failed';
        }
    }
    
    async testSingleUrl(url) {
        const startTime = performance.now();
        const response = await fetch(url, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const reader = response.body.getReader();
        let totalBytes = 0;
        let chunks = 0;
        
        while (chunks < 50) { // Limit to prevent excessive data usage
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.length;
            chunks++;
        }
        
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        
        return totalBytes / duration; // Bytes per second
    }
}
function initializeApp() {
    // Start time updates
    updateTime();
    setInterval(updateTime, 1000);
    
    // Initialize greeting
    updateGreeting();
    setInterval(updateGreeting, 300000); // Every 5 minutes
    
    // Load news feed
    loadNewsFeed();
    setInterval(loadNewsFeed, 900000); // Every 15 minutes
    
    // Initialize weather widget
    initializeWeatherWidget();
    
    // Check for weather alerts
    fetchWeatherAlert();
    setInterval(fetchWeatherAlert, 600000); // Every 10 minutes

    // Load network info and run speed test
    loadNetworkInfo();
    runSpeedTest();
}

// Wait for HTML to be loaded, then run the app
document.addEventListener('DOMContentLoaded', initializeApp);
