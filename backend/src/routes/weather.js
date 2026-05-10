import express from 'express';

const router = express.Router();

// Mock weather data for demo (in production use OpenWeatherMap API)
const getMockWeather = (city) => {
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
  const temp = Math.floor(Math.random() * 20) + 15;
  return {
    city,
    temp,
    feelsLike: temp - 2,
    humidity: Math.floor(Math.random() * 40) + 40,
    windSpeed: Math.floor(Math.random() * 20) + 5,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    forecast: Array.from({ length: 5 }, (_, i) => ({
      day: new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      high: temp + Math.floor(Math.random() * 5),
      low: temp - Math.floor(Math.random() * 8),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
    })),
  };
};

// GET /api/weather/:city
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;

    if (process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'your_openweather_api_key_here') {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=5`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.json({
          city: data.city.name,
          country: data.city.country,
          temp: Math.round(data.list[0].main.temp),
          feelsLike: Math.round(data.list[0].main.feels_like),
          humidity: data.list[0].main.humidity,
          windSpeed: Math.round(data.list[0].wind.speed * 3.6),
          condition: data.list[0].weather[0].main,
          description: data.list[0].weather[0].description,
          forecast: data.list.slice(0, 5).map(item => ({
            day: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
            high: Math.round(item.main.temp_max),
            low: Math.round(item.main.temp_min),
            condition: item.weather[0].main,
          })),
        });
      }
    }

    // Fallback mock data
    res.json(getMockWeather(city));
  } catch (err) {
    res.json(getMockWeather(req.params.city));
  }
});

export default router;
