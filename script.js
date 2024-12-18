const apiKey = 'ff1c8b4cb68f0beb15aeab4fbe8c1e7d';
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const searchHistory = document.getElementById('search-history');
const favoritesList = document.getElementById('favorites-list');
const favoriteBtn = document.getElementById('favorite-btn');
const forecastContainer = document.getElementById('forecast-container');
const maxHistoryItems = 5;

// Načtení dat z localStorage
let searchHistoryArray = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
let favoritesArray = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
let currentCity = '';

// Formátování dat
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return `${days[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`;
}

// Funkce pro aktualizaci historie vyhledávání
function updateSearchHistory(city) {
    searchHistoryArray = [city, ...searchHistoryArray.filter(item => item !== city)];
    if (searchHistoryArray.length > maxHistoryItems) {
        searchHistoryArray = searchHistoryArray.slice(0, maxHistoryItems);
    }
    localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistoryArray));
    displaySearchHistory();
}

// Zobrazení historie vyhledávání
function displaySearchHistory() {
    searchHistory.innerHTML = '';
    searchHistoryArray.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => getWeatherData(city));
        searchHistory.appendChild(li);
    });
}

// Funkce pro přidání/odebrání města z oblíbených
function toggleFavorite() {
    if (!currentCity) return;

    const isFavorite = favoritesArray.includes(currentCity);
    if (isFavorite) {
        favoritesArray = favoritesArray.filter(city => city !== currentCity);
        favoriteBtn.classList.remove('active');
    } else {
        favoritesArray = [...new Set([currentCity, ...favoritesArray])];
        favoriteBtn.classList.add('active');
    }
    
    localStorage.setItem('weatherFavorites', JSON.stringify(favoritesArray));
    displayFavorites();
}

// Zobrazení oblíbených měst
function displayFavorites() {
    favoritesList.innerHTML = '';
    favoritesArray.forEach(city => {
        const li = document.createElement('li');
        li.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                getWeatherData(city);
            }
        });
        
        const citySpan = document.createElement('span');
        citySpan.textContent = city;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            favoritesArray = favoritesArray.filter(c => c !== city);
            localStorage.setItem('weatherFavorites', JSON.stringify(favoritesArray));
            displayFavorites();
            if (city === currentCity) {
                favoriteBtn.classList.remove('active');
            }
        });
        
        li.appendChild(citySpan);
        li.appendChild(removeBtn);
        favoritesList.appendChild(li);
    });
}

// Funkce pro získání předpovědi počasí
async function getForecastData(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=cz&appid=${apiKey}`);
        if (!response.ok) throw new Error('Chyba při načítání předpovědi');
        const data = await response.json();
        
        // Filtrujeme předpověď na jeden záznam denně
        const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);
        displayForecast(dailyForecasts);
    } catch (error) {
        console.error('Chyba při načítání předpovědi:', error);
    }
}

// Zobrazení předpovědi počasí
function displayForecast(forecasts) {
    forecastContainer.innerHTML = '';
    forecasts.forEach(forecast => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="date">${formatDate(forecast.dt)}</div>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}">
            <div class="temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="desc">${forecast.weather[0].description}</div>
        `;
        forecastContainer.appendChild(forecastItem);
    });
}

// Funkce pro získání dat o počasí
async function getWeatherData(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=cz&appid=${apiKey}`);
        
        if (!response.ok) {
            throw new Error('Město nenalezeno');
        }
        
        const data = await response.json();
        currentCity = data.name;
        updateWeatherUI(data);
        updateSearchHistory(currentCity);
        cityInput.value = '';
        
        // Aktualizace stavu tlačítka oblíbených
        favoriteBtn.classList.toggle('active', favoritesArray.includes(currentCity));
        
        // Získání předpovědi pro aktuální město
        getForecastData(data.coord.lat, data.coord.lon);
        
    } catch (error) {
        alert('Chyba při načítání dat: ' + error.message);
    }
}

// Aktualizace UI s počasím
function updateWeatherUI(data) {
    document.getElementById('city').textContent = data.name;
    document.getElementById('temp').textContent = Math.round(data.main.temp);
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = data.main.humidity + '%';
    document.getElementById('wind').textContent = data.wind.speed + ' m/s';
    
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

// Event listenery
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

favoriteBtn.addEventListener('click', toggleFavorite);

// Inicializace při načtení stránky
displaySearchHistory();
displayFavorites();

// Automatické načtení počasí pro poslední hledané město
if (searchHistoryArray.length > 0) {
    getWeatherData(searchHistoryArray[0]);
}