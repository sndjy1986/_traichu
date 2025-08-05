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
// RSS News Feed Function
async function loadCNNNews() {
    try {
        // Using RSS2JSON service to convert CNN RSS to JSON
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=http://rss.cnn.com/rss/edition.rss');
        const data = await response.json();
        
        if (data.status === 'ok') {
            const newsItems = data.items.slice(0, 10); // Get first 10 items
            const ticker = document.getElementById('news-ticker');
            
            let newsHTML = '';
            newsItems.forEach(item => {
                newsHTML += `<a href="${item.link}" target="_blank">${item.title}</a>`;
            });
            
            ticker.innerHTML = newsHTML;
        }
    } catch (error) {
        console.log('Could not load news feed');
        document.getElementById('news-ticker').innerHTML = 'News feed temporarily unavailable';
    }
}

// Load news when page loads
document.addEventListener('DOMContentLoaded', loadCNNNews);

// Refresh news every 5 minutes
setInterval(loadCNNNews, 300000);
