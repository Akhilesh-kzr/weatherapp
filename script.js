

const API_KEY = "3a2bf0eb4858f337cb7985715a9b021c";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherCard = document.getElementById("weatherCard");
const forecastList = document.getElementById("forecastList");
const favoritesList = document.getElementById("favoritesList");
const errorMsg = document.getElementById("errorMsg");
const loading = document.getElementById("loading");
const weatherContent = document.getElementById("weatherContent");
const welcome = document.getElementById("welcome");
const themeBtn = document.getElementById("themeBtn");


let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

async function getWeather(city) {
    const url =
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("City not found. Please enter a valid city.");
        }

        if (response.status === 401) {
            throw new Error("Invalid API key. Please check your API key.");
        }

        throw new Error("Unable to get weather information.");
    }

    const data = await response.json();

    return {
        city: data.name,
        country: data.sys.country,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
    };
}


async function getForecast(city) {
    const url =
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to get forecast information.");
    }

    const data = await response.json();

    
    const dailyData = {};

    data.list.forEach(function (item) {
        const date = item.dt_txt.split(" ")[0];

        if (!dailyData[date]) {
            dailyData[date] = item;
        }

       
        if (item.dt_txt.includes("12:00:00")) {
            dailyData[date] = item;
        }
    });

    return Object.values(dailyData).slice(0, 5);
}


function displayWeather(data) {
    weatherCard.innerHTML = `
        <div class="weather-main">
            <div>
                <h2>${data.city}, ${data.country}</h2>
                <p>Current Weather</p>
                <div class="temperature">${data.temp}°C</div>
                <p>${data.description}</p>
                <p>Feels like ${data.feelsLike}°C</p>
            </div>

            <img
                class="weather-icon"
                src="https://openweathermap.org/img/wn/${data.icon}@2x.png"
                alt="${data.description}"
            >
        </div>

        <div class="weather-details">
            <div class="detail">
                <p>💧 Humidity</p>
                <strong>${data.humidity}%</strong>
            </div>

            <div class="detail">
                <p>🌬 Wind Speed</p>
                <strong>${data.windSpeed} m/s</strong>
            </div>

            <div class="detail">
                <p>🌡 Feels Like</p>
                <strong>${data.feelsLike}°C</strong>
            </div>
        </div>

        <button class="favorite-btn" id="addFavoriteBtn">
            ⭐ Add to Favorites
        </button>
    `;

    document.getElementById("addFavoriteBtn").addEventListener(
        "click",
        function () {
            addFavorite(data.city);
        }
    );
}


function displayForecast(data) {
    forecastList.innerHTML = "";

    data.forEach(function (day) {
        const date = new Date(day.dt_txt);
        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h3>${dayName}</h3>
            <img
                src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png"
                alt="${day.weather[0].description}"
            >
            <p>${Math.round(day.main.temp)}°C</p>
            <p>${day.weather[0].description}</p>
        `;

        forecastList.appendChild(card);
    });
}


async function searchWeather(city) {
    city = city.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    loading.style.display = "block";
    errorMsg.textContent = "";
    weatherContent.hidden = true;
    welcome.style.display = "none";

    try {
        
        const results = await Promise.all([
            getWeather(city),
            getForecast(city)
        ]);

        const currentWeather = results[0];
        const forecastData = results[1];

        displayWeather(currentWeather);
        displayForecast(forecastData);

        weatherContent.hidden = false;

    } catch (error) {
        showError(error.message);

    } finally {
        loading.style.display = "none";
    }
}


function showError(message) {
    errorMsg.textContent = message;
}


function addFavorite(city) {
    const exists = favorites.some(function (item) {
        return item.toLowerCase() === city.toLowerCase();
    });

    if (exists) {
        showError("This city is already in your favorites.");
        return;
    }

    favorites.push(city);

    localStorage.setItem("favorites", JSON.stringify(favorites));

    errorMsg.textContent = "";
    loadFavorites();
}


function loadFavorites() {
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        favoritesList.textContent = "No favorite cities added yet.";
        return;
    }

    favorites.forEach(function (city) {
        const item = document.createElement("div");
        item.className = "favorite-item";

        const cityName = document.createElement("span");
        cityName.textContent = city;

        cityName.addEventListener("click", function () {
            cityInput.value = city;
            searchWeather(city);
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "Remove";

        removeBtn.addEventListener("click", function () {
            removeFavorite(city);
        });

        item.appendChild(cityName);
        item.appendChild(removeBtn);

        favoritesList.appendChild(item);
    });
}


function removeFavorite(city) {
    favorites = favorites.filter(function (item) {
        return item.toLowerCase() !== city.toLowerCase();
    });

    localStorage.setItem("favorites", JSON.stringify(favorites));

    loadFavorites();
}
function debounce(callback, delay) {
    let timer;

    return function () {
        clearTimeout(timer);

        const city = cityInput.value.trim();

        if (!city) {
            return;
        }

        timer = setTimeout(function () {
            callback(city);
        }, delay);
    };
}


const debouncedSearch = debounce(searchWeather, 500);


themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    themeBtn.textContent = isDark ? "☀ Light" : "🌙 Dark";

    localStorage.setItem("theme", isDark ? "dark" : "light");
});


function loadTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeBtn.textContent = "☀ Light";
    }
}


searchBtn.addEventListener("click", function () {
    searchWeather(cityInput.value);
});

cityInput.addEventListener("input", debouncedSearch);

cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchWeather(cityInput.value);
    }
});


document.addEventListener("DOMContentLoaded", function () {
    loadFavorites();
    loadTheme();
});
