import React, { createFactory } from 'react';
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
    .toUpperCase()               // Ensure the country code is uppercase
    .split('')                   // Split into individual characters
    .map(char => 127397 + char.charCodeAt(0)); // Convert each character to a regional indicator
  return String.fromCodePoint(...codePoints); // Convert code points to a flag emoji
}


function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: "london", // initial location
      isLoading: false,
      displayLocation: "",
      weather: {}
    };

    this.fetchWeather = this.fetchWeather.bind(this);
  }

  async fetchWeather() {
    if(this.state.location.length < 2) return;

    try {
      this.setState({ isLoading: true });

      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      ); // changed from this.location to this.state.location
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

        this.setState({
          displayLocation: `${name} ${convertToFlag(country_code)}`,
        });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.log(err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  setLocation =(e) => this.setState({ location: e.target.value 
  });

  // it same as useEffect with empty depandancey array
  componentDidMount(){
    this.fetchWeather();

    this.setState({location:localStorage.getItem('location') || ""});
  }

    // it same as useEffect with [location] in the depandancey array
    componentDidUpdate(prevProps , prevState){
      if(this.state.location !== prevState.location){
        this.fetchWeather();

        localStorage.setItem("location", this.state.location);
      }
    }

    render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>
        <Input
        location={this.state.location}
        onChangeeLocation={this.setLocation}/>
        {this.state.isLoading && <p className="loader">Loading ... 
                  </p>}
        {this.state.weather.weathercode && (
          <Weather
            weather={this.state.weather}
            location={this.state.displayLocation}
          />
        )}
      </div>
    );
  }
}

class Input extends React.Component {
  render() {
    return (
      <div>
      <input
        type="text"
        placeholder="Search for Location..."
        value={this.props.location}
        onChange={(e) => this.props.onChangeeLocation(e)}
      />
    </div>
    )
  }
}

class Weather extends React.Component {
  render() {
    const {
      temperature_2m_max: max,
      temperature_2m_min: min, // Fix here: changed from minx to min
      time: dates,
      weathercode: codes,
    } = this.props.weather;
    // const {display_Location: displayLocation}=this.props.location;
    console.log(this.props.location);
    return (
      <div>
        <h2>Weather {this.props.location}</h2>
        <ul className="weather">
          {dates.map((date, i) => (
            <Day
              date={date}
              max={max.at(i)}
              min={min.at(i)}
              code={codes.at(i)}
              key={date}
              isToday={i===0}
            />
          ))}
        </ul>
      </div>
    );
  }
}

  class Day extends React.Component{
    render(){
    const {date , min , max , code ,isToday} =this.props;
      return <li className="day">
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? "Today" : formatDay(date)}</p>
        <p>{Math.floor(min)}&deg; - {Math.floor(max)}&deg;</p>
        <p>{date}</p>

        </li>
    }
  }










