require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Concert = require('../models/concert.model');
const Performance = require('../models/performance.model');
const Artist = require('../models/artist.model');
const Category = require('../models/category.model');
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

const cities = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao'];
const venues = ['Estadi Olímpic', 'Movistar Arena', 'Auditorio Marina', 'Sala Custom', 'Bilbao Arena'];

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

const buildPerformance = (concertId, title, index, artistId) => {
  const month = index % 12;
  const dayOfMonth = (index % 27) + 1;
  const city = cities[index % cities.length];
  const startsAt = new Date(Date.UTC(2027, month, dayOfMonth, 20, 0, 0));
  const dayText = startsAt.toISOString().slice(0, 10);

  return {
    concertId,
    slug: generateSlug(`${title}-${city}-${dayText}`),
    venue: venues[index % venues.length],
    city,
    startsAt,
    endsAt: null,
    capacity: 1000,
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

  for (const [index, title] of sampleTitles.entries()) {
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

    await Performance.create(buildPerformance(concert._id, title, index, artist?._id));
    createdCount += 1;
  }

  console.log(`Conciertos preparados. Creados: ${createdCount}. Actualizados: ${backfilledCount}.`);
};

const seed = async () => {
  try {
    await connectDB();
    await seedArtists();
    await seedCategories();
    await seedConcerts();
  } catch (error) {
    console.error('Error en el seeder:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
