// seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  title: String, location: String, price: Number, size: Number, lat: Number, lng: Number
});
const House = mongoose.model('House', houseSchema);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await House.deleteMany({});
  const data = [
    { title: 'Cozy 2BR Nairobi', location: 'Nairobi', price: 25000, size: 2, lat: -1.2921, lng: 36.8219 },
    { title: 'Studio Mombasa', location: 'Mombasa', price: 12000, size: 1, lat: -4.0435, lng: 39.6682 },
    { title: 'Family 3BR Kisumu', location: 'Kisumu', price: 30000, size: 3, lat: -0.0917, lng: 34.7679 },
    { title: 'Nakuru 2BR', location: 'Nakuru', price: 20000, size: 2, lat: -0.3031, lng: 36.0800 },
    { title: 'Luxury 4BR Nairobi', location: 'Nairobi', price: 65000, size: 4, lat: -1.2833, lng: 36.8167 }
  ];
  await House.insertMany(data);
  console.log('Seeded sample houses');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
