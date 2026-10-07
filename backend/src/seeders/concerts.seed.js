require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Concert = require('../models/concert.model');
const { generateSlug } = require('../utils/slug.util');

const sampleTitles = [
  'Myke Towers',
  'Camin',
  'Bad Bunny',
  'Estopa',
  'De la Rose',
  'Chimbala',
  'Blessd',
  'Bryant Myers',
  'Ñengo Flow',
  'Quevedo'
];

const cities = [
  'Barcelona',
  'Madrid',
  'Valencia',
  'Sevilla',
  'Bilbao'
];

const venues = [
  'Estadi Olímpic',
  'Movistar Arena',
  'Auditorio Marina',
  'Sala Custom',
  'Bilbao Arena'
];

const buildConcert = (title, index) => {
  const month = index % 12;
  const day = (index % 27) + 1;

  return {
    title,
    city: cities[index % cities.length],
    venue: venues[index % venues.length],
    date: new Date(Date.UTC(2027, month, day, 20, 0, 0)),
    price: 25 + index * 3,
    slug: generateSlug(`${title}-${cities[index % cities.length]}`),
    status: 'scheduled',
    isActive: true,
    createdAt: new Date(),
    updatedAt: null,
    deletedAt: null
  };
};

const seedConcerts = async () => {
  try {
    await connectDB();

    let createdCount = 0;

    for (const [index, title] of sampleTitles.entries()) {
      const concert = buildConcert(title, index);

      const existingConcert = await Concert.findOne({
        title: concert.title,
        city: concert.city
      })
        .setOptions({ includeDeleted: true })
        .select('_id');

      if (existingConcert) {
        continue;
      }

      const baseSlug = concert.slug || 'concierto';
      let candidateSlug = baseSlug;
      let suffix = 2;

      while (
        await Concert.findOne({ slug: candidateSlug })
          .setOptions({ includeDeleted: true })
          .select('_id')
      ) {
        candidateSlug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      await Concert.create({
        ...concert,
        slug: candidateSlug
      });

      createdCount += 1;
    }

    console.log(`Seed completado. Conciertos creados: ${createdCount}.`);
  } catch (error) {
    console.error('Error al crear los conciertos de ejemplo:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedConcerts();