import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@traveloop.com' },
    update: {},
    create: {
      email: 'admin@traveloop.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('Demo@123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@traveloop.com' },
    update: {},
    create: {
      email: 'demo@traveloop.com',
      password: userPassword,
      name: 'Alex Explorer',
      bio: 'Passionate traveler | 30+ countries visited',
      isEmailVerified: true,
    },
  });

  // Seed cities
  const cities = [
    { name: 'Paris', country: 'France', continent: 'Europe', popularity: 98, costIndex: 75, rating: 4.8, currency: 'EUR', timezone: 'Europe/Paris', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', description: 'The City of Light, famous for the Eiffel Tower and world-class cuisine.' },
    { name: 'Tokyo', country: 'Japan', continent: 'Asia', popularity: 96, costIndex: 65, rating: 4.9, currency: 'JPY', timezone: 'Asia/Tokyo', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', description: 'A dazzling blend of ultramodern and traditional.' },
    { name: 'New York', country: 'USA', continent: 'North America', popularity: 97, costIndex: 90, rating: 4.7, currency: 'USD', timezone: 'America/New_York', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', description: 'The city that never sleeps — iconic skyline and cultural hub.' },
    { name: 'Bali', country: 'Indonesia', continent: 'Asia', popularity: 92, costIndex: 30, rating: 4.8, currency: 'IDR', timezone: 'Asia/Makassar', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', description: 'Island paradise with temples, rice terraces, and stunning beaches.' },
    { name: 'Rome', country: 'Italy', continent: 'Europe', popularity: 94, costIndex: 70, rating: 4.8, currency: 'EUR', timezone: 'Europe/Rome', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', description: 'The Eternal City — ancient ruins, Renaissance art, and Italian cuisine.' },
    { name: 'Barcelona', country: 'Spain', continent: 'Europe', popularity: 91, costIndex: 65, rating: 4.7, currency: 'EUR', timezone: 'Europe/Madrid', imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', description: 'Gaudí architecture, vibrant nightlife, and Mediterranean beaches.' },
    { name: 'Dubai', country: 'UAE', continent: 'Asia', popularity: 95, costIndex: 85, rating: 4.6, currency: 'AED', timezone: 'Asia/Dubai', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', description: 'Futuristic skyline, luxury shopping, and desert adventures.' },
    { name: 'Sydney', country: 'Australia', continent: 'Oceania', popularity: 90, costIndex: 80, rating: 4.7, currency: 'AUD', timezone: 'Australia/Sydney', imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', description: 'Iconic Opera House, Harbour Bridge, and pristine beaches.' },
    { name: 'Santorini', country: 'Greece', continent: 'Europe', popularity: 89, costIndex: 72, rating: 4.9, currency: 'EUR', timezone: 'Europe/Athens', imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', description: 'White-washed buildings, caldera views, and breathtaking sunsets.' },
    { name: 'Kyoto', country: 'Japan', continent: 'Asia', popularity: 88, costIndex: 60, rating: 4.9, currency: 'JPY', timezone: 'Asia/Tokyo', imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', description: 'Ancient temples, geisha districts, and serene bamboo forests.' },
    { name: 'Maldives', country: 'Maldives', continent: 'Asia', popularity: 87, costIndex: 120, rating: 4.9, currency: 'MVR', timezone: 'Indian/Maldives', imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800', description: 'Crystal-clear waters, overwater bungalows, and coral reefs.' },
    { name: 'Prague', country: 'Czech Republic', continent: 'Europe', popularity: 85, costIndex: 45, rating: 4.8, currency: 'CZK', timezone: 'Europe/Prague', imageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800', description: 'Fairy-tale architecture, medieval old town, and vibrant nightlife.' },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { id: city.name + '_' + city.country },
      update: {},
      create: {
        id: city.name + '_' + city.country,
        ...city,
      },
    });
  }

  // Create demo trip
  const trip = await prisma.trip.create({
    data: {
      userId: demoUser.id,
      title: 'European Dream Adventure',
      description: 'A magical 2-week journey through the best of Europe — art, food, history, and breathtaking scenery.',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-30'),
      travelerCount: 2,
      status: 'UPCOMING',
      coverImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200',
      totalBudget: 5500,
      currency: 'USD',
    },
  });

  // Add stops
  const parisStop = await prisma.stop.create({
    data: {
      tripId: trip.id,
      cityName: 'Paris',
      country: 'France',
      arrivalDate: new Date('2024-06-15'),
      departureDate: new Date('2024-06-19'),
      order: 0,
      nights: 4,
    },
  });

  const romeStop = await prisma.stop.create({
    data: {
      tripId: trip.id,
      cityName: 'Rome',
      country: 'Italy',
      arrivalDate: new Date('2024-06-19'),
      departureDate: new Date('2024-06-23'),
      order: 1,
      nights: 4,
    },
  });

  const barcelonaStop = await prisma.stop.create({
    data: {
      tripId: trip.id,
      cityName: 'Barcelona',
      country: 'Spain',
      arrivalDate: new Date('2024-06-23'),
      departureDate: new Date('2024-06-30'),
      order: 2,
      nights: 7,
    },
  });

  // Add activities to Paris
  await prisma.activity.createMany({
    data: [
      { stopId: parisStop.id, name: 'Eiffel Tower Visit', category: 'SIGHTSEEING', duration: 120, cost: 28, description: 'Visit the iconic iron tower with stunning city views.', order: 0 },
      { stopId: parisStop.id, name: 'Louvre Museum', category: 'CULTURE', duration: 180, cost: 17, description: 'Explore world-famous art including the Mona Lisa.', order: 1 },
      { stopId: parisStop.id, name: 'Seine River Cruise', category: 'SIGHTSEEING', duration: 60, cost: 15, description: 'Scenic boat cruise along the Seine River.', order: 2 },
      { stopId: parisStop.id, name: 'Montmartre Food Tour', category: 'FOOD', duration: 150, cost: 65, description: 'Guided culinary tour through artistic Montmartre.', order: 3 },
    ],
  });

  // Add activities to Rome
  await prisma.activity.createMany({
    data: [
      { stopId: romeStop.id, name: 'Colosseum Tour', category: 'CULTURE', duration: 150, cost: 22, description: 'Explore the ancient Roman amphitheatre.', order: 0 },
      { stopId: romeStop.id, name: 'Vatican Museums', category: 'CULTURE', duration: 240, cost: 35, description: 'See the Sistine Chapel and papal collections.', order: 1 },
      { stopId: romeStop.id, name: 'Trastevere Food Walk', category: 'FOOD', duration: 120, cost: 45, description: 'Evening food tour in the charming Trastevere district.', order: 2 },
    ],
  });

  // Add activities to Barcelona
  await prisma.activity.createMany({
    data: [
      { stopId: barcelonaStop.id, name: 'Sagrada Família', category: 'CULTURE', duration: 120, cost: 33, description: 'Gaudí\'s unfinished masterpiece basilica.', order: 0 },
      { stopId: barcelonaStop.id, name: 'Park Güell', category: 'NATURE', duration: 90, cost: 13, description: 'Colorful mosaic park with panoramic city views.', order: 1 },
      { stopId: barcelonaStop.id, name: 'Barceloneta Beach', category: 'NATURE', duration: 180, cost: 0, description: 'Relax on Barcelona\'s famous city beach.', order: 2 },
      { stopId: barcelonaStop.id, name: 'Tapas & Flamenco Night', category: 'NIGHTLIFE', duration: 240, cost: 85, description: 'Traditional tapas dinner with live flamenco show.', order: 3 },
    ],
  });

  // Create budget
  await prisma.budget.create({
    data: {
      tripId: trip.id,
      transportCost: 1200,
      hotelCost: 2400,
      foodCost: 800,
      activityCost: 600,
      miscCost: 500,
      totalBudget: 5500,
      currency: 'USD',
    },
  });

  // Create notes
  await prisma.note.createMany({
    data: [
      { tripId: trip.id, userId: demoUser.id, title: 'Pre-trip checklist', content: 'Book airport transfers, buy travel insurance, notify bank of travel dates.', type: 'REMINDER', isPinned: true },
      { tripId: trip.id, userId: demoUser.id, title: 'Paris Day 1', content: 'Arrived at CDG, check into hotel near Le Marais. Evening walk along the Seine.', type: 'DAY_NOTE', day: 1 },
    ],
  });

  // Create packing list
  const packingList = await prisma.packingList.create({
    data: {
      tripId: trip.id,
      userId: demoUser.id,
    },
  });

  await prisma.packingItem.createMany({
    data: [
      { packingListId: packingList.id, name: 'Passport', category: 'DOCUMENTS', isPacked: true },
      { packingListId: packingList.id, name: 'Travel Insurance', category: 'DOCUMENTS', isPacked: true },
      { packingListId: packingList.id, name: 'T-Shirts', category: 'CLOTHING', quantity: 5 },
      { packingListId: packingList.id, name: 'Comfortable Walking Shoes', category: 'CLOTHING', isPacked: false },
      { packingListId: packingList.id, name: 'Phone Charger', category: 'ELECTRONICS', isPacked: true },
      { packingListId: packingList.id, name: 'Power Bank', category: 'ELECTRONICS', isPacked: false },
      { packingListId: packingList.id, name: 'Travel Adapter', category: 'ELECTRONICS', isPacked: false },
      { packingListId: packingList.id, name: 'Pain Relievers', category: 'MEDICINES', isPacked: true },
      { packingListId: packingList.id, name: 'Sunscreen', category: 'TOILETRIES', quantity: 2 },
    ],
  });

  // Save destinations for demo user
  await prisma.savedDestination.createMany({
    data: [
      { userId: demoUser.id, cityName: 'Santorini', country: 'Greece', imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400' },
      { userId: demoUser.id, cityName: 'Bali', country: 'Indonesia', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
      { userId: demoUser.id, cityName: 'Kyoto', country: 'Japan', imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400' },
    ],
  });

  console.log('✅ Seed completed!');
  console.log('👤 Admin: admin@traveloop.com / Admin@123');
  console.log('👤 Demo: demo@traveloop.com / Demo@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
