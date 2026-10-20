require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Concert = require('../models/concert.model');
const Performance = require('../models/performance.model');
const Artist = require('../models/artist.model');
const Category = require('../models/category.model');
const Venue = require('../models/venue.model');
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

const sampleCategories = [
  { name: 'Rock', description: 'Rock en español e internacional.' },
  { name: 'Pop', description: 'Pop para todos los públicos.' },
  { name: 'Rap', description: 'Rap y hip hop.' },
  { name: 'Reguetón', description: 'Reguetón y música urbana latina.' },
  { name: 'Electrónica', description: 'Música electrónica y DJ sets.' }
];

// Categorías asignadas a cada concierto de ejemplo (por título del concierto)
const concertCategories = {
  'Myke Towers': ['Reguetón'],
  Camin: ['Rap'],
  'Bad Bunny': ['Reguetón', 'Pop'],
  Estopa: ['Rock'],
  'De la Rose': ['Pop'],
  Chimbala: ['Rap'],
  Blessd: ['Rap'],
  'Bryant Myers': ['Reguetón'],
  'Ñengo Flow': ['Reguetón'],
  Quevedo: ['Pop']
};

// Salas de ejemplo. La ciudad de cada sesión sale de la sala donde se celebra.
const sampleVenues = [
  { name: 'Estadi Olímpic', city: 'Barcelona', capacity: 55000 },
  { name: 'Movistar Arena', city: 'Madrid', capacity: 15000 },
  { name: 'Auditorio Marina', city: 'Valencia', capacity: 4000 },
  { name: 'Sala Custom', city: 'Sevilla', capacity: 1200 },
  { name: 'Bilbao Arena', city: 'Bilbao', capacity: 9000 }
];

const buildUniqueArtistSlug = async (name) => {
  const baseSlug = generateSlug(name) || 'artista';
  let slug = baseSlug;
  let suffix = 2;

  while (await Artist.findOne({ slug }).setOptions({ includeDeleted: true })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const buildUniqueCategorySlug = async (name) => {
  const baseSlug = generateSlug(name) || 'categoria';
  let slug = baseSlug;
  let suffix = 2;

  while (await Category.findOne({ slug }).setOptions({ includeDeleted: true })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const buildUniqueVenueSlug = async (name) => {
  const baseSlug = generateSlug(name) || 'sala';
  let slug = baseSlug;
  let suffix = 2;

  while (await Venue.findOne({ slug }).setOptions({ includeDeleted: true })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const seedVenues = async () => {
  let createdCount = 0;
  let skippedCount = 0;

  for (const { name, city, capacity } of sampleVenues) {
    const existing = await Venue.findOne({ name }).setOptions({ includeDeleted: true });

    if (existing) {
      skippedCount += 1;
      continue;
    }

    await Venue.create({
      name,
      slug: await buildUniqueVenueSlug(name),
      description: `Sala de ejemplo en ${city}.`,
      address: `Dirección de ejemplo, ${city}`,
      city,
      capacity,
      images: [],
      website: '',
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    });

    createdCount += 1;
  }

  console.log(`Salas preparadas. Creadas: ${createdCount}. Ya existían: ${skippedCount}.`);
};

// Sesiones creadas antes de existir las salas: pasan de texto (venue, capacity) a venueId.
// Usa la colección directamente para poder leer el campo antiguo.
const migrateLegacyPerformances = async () => {
  const legacy = await Performance.collection.find({ venueId: { $exists: false } }).toArray();
  const fallback = await Venue.findOne({}).sort({ name: 1 });
  let migratedCount = 0;

  for (const performance of legacy) {
    const venue = (await Venue.findOne({ name: performance.venue })) ?? fallback;
    if (!venue) break;

    await Performance.collection.updateOne(
      { _id: performance._id },
      { $set: { venueId: venue._id, city: venue.city }, $unset: { venue: '', capacity: '' } }
    );
    migratedCount += 1;
  }

  if (migratedCount > 0) console.log(`Sesiones migradas a salas: ${migratedCount}.`);
};

const seedArtists = async () => {
  let createdCount = 0;
  let skippedCount = 0;

  for (const name of sampleTitles) {
    const existing = await Artist.findOne({ name }).setOptions({ includeDeleted: true });

    if (existing) {
      skippedCount += 1;
      continue;
    }

    await Artist.create({
      name,
      slug: await buildUniqueArtistSlug(name),
      bio: '',
      socials: [],
      images: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    });

    createdCount += 1;
  }

  console.log(`Artistas preparados. Creados: ${createdCount}. Ya existían: ${skippedCount}.`);
};

const seedCategories = async () => {
  let createdCount = 0;
  let skippedCount = 0;

  for (const { name, description } of sampleCategories) {
    const existing = await Category.findOne({ name }).setOptions({ includeDeleted: true });

    if (existing) {
      skippedCount += 1;
      continue;
    }

    await Category.create({
      name,
      slug: await buildUniqueCategorySlug(name),
      description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    });

    createdCount += 1;
  }

  console.log(`Categorías preparadas. Creadas: ${createdCount}. Ya existían: ${skippedCount}.`);
};

const findCategoryIdsFor = async (title) => {
  const names = concertCategories[title] ?? [];

  if (names.length === 0) return [];

  const categories = await Category.find({ name: { $in: names } }).select('_id');
  return categories.map((category) => category._id);
};

const buildPerformance = (concertId, title, index, artistId, venue) => {
  const month = index % 12;
  const dayOfMonth = (index % 27) + 1;
  const startsAt = new Date(Date.UTC(2027, month, dayOfMonth, 20, 0, 0));
  const dayText = startsAt.toISOString().slice(0, 10);

  return {
    concertId,
    slug: generateSlug(`${title}-${venue.city}-${dayText}`),
    venueId: venue._id,
    city: venue.city,
    startsAt,
    endsAt: null,
    price: 25 + index * 3,
    bookedParticipants: 0,
    status: 'scheduled',
    isActive: true,
    artistIds: artistId ? [artistId] : []
  };
};

const buildDescription = (title) => `Concierto de ${title} en Ritmo.`;

const seedConcerts = async () => {
  let createdCount = 0;
  let backfilledCount = 0;

  const venueList = await Venue.find({}).sort({ name: 1 });

  for (const [index, title] of sampleTitles.entries()) {
    const venue = venueList[index % venueList.length];
    const existingConcert = await Concert.findOne({ title })
      .setOptions({ includeDeleted: true })
      .select('_id description artistIds categoryIds');

    const artist = await Artist.findOne({ name: title });
    const categoryIds = await findCategoryIdsFor(title);

    if (existingConcert) {
      const needsArtists = Boolean(artist) && (existingConcert.artistIds?.length ?? 0) === 0;
      const needsDescription = !existingConcert.description;
      const needsCategories = categoryIds.length > 0 && (existingConcert.categoryIds?.length ?? 0) === 0;

      if (needsArtists || needsDescription || needsCategories) {
        await Concert.updateOne(
          { _id: existingConcert._id },
          {
            ...(needsArtists ? { artistIds: [artist._id] } : {}),
            ...(needsDescription ? { description: buildDescription(title) } : {}),
            ...(needsCategories ? { categoryIds } : {})
          }
        );

        if (needsArtists) {
          await Performance.updateMany(
            { concertId: existingConcert._id, artistIds: { $size: 0 } },
            { artistIds: [artist._id] }
          );
        }

        backfilledCount += 1;
      }

      continue;
    }

    const baseSlug = generateSlug(title) || 'concierto';
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

    const concert = await Concert.create({
      title,
      description: buildDescription(title),
      artistIds: artist ? [artist._id] : [],
      categoryIds,
      slug: candidateSlug,
      status: 'scheduled',
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    });

    await Performance.create(buildPerformance(concert._id, title, index, artist?._id, venue));
    createdCount += 1;
  }

  console.log(`Conciertos preparados. Creados: ${createdCount}. Actualizados: ${backfilledCount}.`);
};

const seed = async () => {
  try {
    await connectDB();
    await seedArtists();
    await seedCategories();
    await seedVenues();
    await migrateLegacyPerformances();
    await seedConcerts();
  } catch (error) {
    console.error('Error en el seeder:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
