import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// AI-powered itinerary suggestions (mock AI — in production use OpenAI/Gemini)
const generateItinerary = (cities, days, travelStyle, budget) => {
  const suggestions = {
    adventure: ['Hiking trail', 'White water rafting', 'Rock climbing', 'Paragliding'],
    culture: ['Museum visit', 'Historical tour', 'Local cooking class', 'Temple visit'],
    food: ['Street food tour', 'Fine dining experience', 'Market visit', 'Wine tasting'],
    nature: ['National park visit', 'Sunset viewpoint', 'Beach day', 'Botanical garden'],
    nightlife: ['Rooftop bar', 'Live music venue', 'Night market', 'Club night'],
  };

  const style = travelStyle || 'culture';
  const activities = suggestions[style] || suggestions.culture;

  return cities.map((city, cityIdx) => ({
    city,
    days: Math.floor(days / cities.length) + (cityIdx === 0 ? days % cities.length : 0),
    suggestedActivities: activities.slice(0, 3).map((name, i) => ({
      name: `${name} in ${city}`,
      day: i + 1,
      estimatedCost: Math.floor(Math.random() * 50) + 15,
      duration: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3) + 3} hours`,
      type: style,
    })),
    estimatedBudget: {
      hotel: Math.floor((budget / cities.length) * 0.4),
      food: Math.floor((budget / cities.length) * 0.25),
      activities: Math.floor((budget / cities.length) * 0.2),
      transport: Math.floor((budget / cities.length) * 0.15),
    },
    tips: [
      `Best time to visit ${city} is early morning`,
      `Book accommodation in advance for ${city}`,
      `Local transport is the best way to explore ${city}`,
    ],
  }));
};

// POST /api/ai/suggest-itinerary
router.post('/suggest-itinerary', authenticate, async (req, res) => {
  try {
    const { cities, days, travelStyle, budget, currency, interests } = req.body;

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ error: 'Cities array is required' });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const itinerary = generateItinerary(cities, days || 7, travelStyle, budget || 2000);

    const response = {
      success: true,
      generatedAt: new Date().toISOString(),
      input: { cities, days, travelStyle, budget, currency },
      itinerary,
      summary: {
        totalDays: days || 7,
        totalCities: cities.length,
        estimatedBudget: budget || 2000,
        currency: currency || 'USD',
        style: travelStyle || 'culture',
      },
      packingTips: [
        'Pack comfortable walking shoes',
        'Bring a universal travel adapter',
        'Download offline maps',
        'Keep copies of important documents',
        'Get travel insurance',
      ],
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

// POST /api/ai/budget-estimate
router.post('/budget-estimate', authenticate, async (req, res) => {
  try {
    const { cities, days, travelers, travelStyle } = req.body;

    const styleMultipliers = { budget: 0.6, comfort: 1, luxury: 2.5 };
    const multiplier = styleMultipliers[travelStyle] || 1;

    const basePrices = {
      hotel: 80,
      food: 45,
      transport: 30,
      activities: 40,
      misc: 20,
    };

    const totalDays = parseInt(days) || 7;
    const numCities = cities?.length || 1;
    const numTravelers = parseInt(travelers) || 1;

    const estimate = {
      hotel: Math.round(basePrices.hotel * totalDays * multiplier * numTravelers),
      food: Math.round(basePrices.food * totalDays * multiplier * numTravelers),
      transport: Math.round(basePrices.transport * numCities * multiplier * numTravelers),
      activities: Math.round(basePrices.activities * totalDays * multiplier * numTravelers),
      misc: Math.round(basePrices.misc * totalDays * numTravelers),
    };

    estimate.total = Object.values(estimate).reduce((a, b) => a + b, 0);
    estimate.perPerson = Math.round(estimate.total / numTravelers);
    estimate.perDay = Math.round(estimate.total / totalDays);

    res.json({ estimate, currency: 'USD', travelStyle, disclaimer: 'Estimates are approximate based on average prices' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to estimate budget' });
  }
});

// POST /api/ai/destination-recommend
router.post('/destination-recommend', authenticate, async (req, res) => {
  try {
    const { interests, budget, duration, climate, fromCountry } = req.body;

    // Simplified recommendation logic
    const recommendations = [
      { city: 'Bali', country: 'Indonesia', score: 95, reason: 'Perfect mix of culture, nature and affordability', costIndex: 30, rating: 4.8 },
      { city: 'Prague', country: 'Czech Republic', score: 88, reason: 'Historical charm with great value', costIndex: 45, rating: 4.7 },
      { city: 'Kyoto', country: 'Japan', score: 92, reason: 'Rich cultural heritage and unique experiences', costIndex: 60, rating: 4.9 },
      { city: 'Lisbon', country: 'Portugal', score: 87, reason: 'Vibrant culture with mild weather year-round', costIndex: 55, rating: 4.7 },
      { city: 'Chiang Mai', country: 'Thailand', score: 90, reason: 'Excellent food scene and temple culture', costIndex: 25, rating: 4.8 },
    ];

    await new Promise(resolve => setTimeout(resolve, 500));
    res.json({ recommendations, basedOn: { interests, budget, duration, climate } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

export default router;
