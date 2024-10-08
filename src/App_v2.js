import React, { useEffect, useState } from "react";
//function that will get these weather icons here.
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

// This function converts a country code (like 'US' or 'PT') to its corresponding flag emoji.
function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase() // Ensure the country code is uppercase
    .split("") // Split into individual characters
    .map((char) => 127397 + char.charCodeAt(0)); // Convert each character to a regional indicator
  return String.fromCodePoint(...codePoints); // Convert code points to a flag emoji
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

function useFetchWeather(location) {
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});

  useEffect(() => {
    // Define fetchWeather function inside the hook
    async function fetchWeather() {
      if (location.length < 2) {
        setWeather({});
        return;
      }

      try {
        setIsLoading(true);

        // 1) Getting location (geocoding)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const geoData = await geoRes.json();
        console.log(geoData);

        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results.at(0);

        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        // 2) Getting actual weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        setWeather(weatherData.daily);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWeather();
  }, [location]);

  // Auto-fetch weather when the location changes

  return { isLoading, displayLocation, weather };
}

export function useLocalStorageState(initialState, key) {
  // Ensure `key` is a string
  if (typeof key !== "string") {
    throw new Error("Key must be a string");
  }

  const [value, setValue] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialState;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
}

export default function App() {
  // Use the custom hook for managing location state with localStorage
  const [location, setLocation] = useLocalStorageState("", "location");

  // Use the custom hook for fetching weather data based on the current location
  const { isLoading, displayLocation, weather } = useFetchWeather(location);

  return (
    <div className="app">
      <h1>Classy Weather</h1>

      {/* Input component for setting the location */}
      <Input location={location} onChangeeLocation={setLocation} />

      {/* Show a loading message while fetching weather data */}
      {isLoading && <p className="loader">Loading ...</p>}

      {/* Display weather information if weather data is available */}
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}

export function Input({ location, onChangeeLocation }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Search for Location..."
        value={location}
        onChange={(e) => onChangeeLocation(e.target.value)}
      />
    </div>
  );
}

export function Weather({ weather, location }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min, // Fix here: changed from minx to min
    time: dates,
    weathercode: codes,
  } = weather;

  return (
    <div>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

export function Day({ date, min, max, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; - {Math.floor(max)}&deg;
      </p>
      <p>{date}</p>
    </li>
  );
}
