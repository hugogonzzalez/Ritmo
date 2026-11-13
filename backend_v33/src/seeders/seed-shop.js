// Datos de prueba para la tienda: artistas, salas, conciertos, sesiones y variantes.
// Se ejecuta después de `npm run seed`. Es seguro repetirlo: no duplica lo que ya existe.
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Artist = require('../models/artist.model');
const Category = require('../models/category.model');
const Venue = require('../models/venue.model');
const Concert = require('../models/concert.model');
const Performance = require('../models/performance.model');
const Variant = require('../models/variant.model');
const { generateSlug } = require('../utils/slug.util');
const { generateSku } = require('../utils/sku');

// Salas reales. Las capacidades son aproximadas y conviene revisarlas.
const venues = [
  { name: 'Estadio Santiago Bernabéu', city: 'Madrid', address: 'Av. de Concha Espina, 1', capacity: 81000 },
  { name: 'Estadio Metropolitano', city: 'Madrid', address: 'Av. Luis Aragonés, 4', capacity: 68000 },
  { name: 'Palau Sant Jordi', city: 'Barcelona', address: 'Passeig Olímpic, 5-7', capacity: 17000 },
  { name: 'Estadio de La Cartuja', city: 'Sevilla', address: 'Isla de la Cartuja, s/n', capacity: 57000 },
  { name: 'Estadio Benito Villamarín', city: 'Sevilla', address: 'Av. de Heliópolis, s/n', capacity: 60000 },
  { name: 'Estadio de Mestalla', city: 'Valencia', address: 'Av. de Suecia, s/n', capacity: 49000 },
  { name: 'Estadio Reale Arena', city: 'San Sebastián', address: 'Paseo de Anoeta, 1', capacity: 40000 },
  { name: 'Auditorio Nacional de Música', city: 'Madrid', address: 'Calle del Príncipe de Vergara, 146', capacity: 2300 },
  { name: 'Sala Joy Eslava', city: 'Madrid', address: 'Calle del Arenal, 11', capacity: 1000, description: 'Discoteca y sala de conciertos.' },
  { name: 'Razzmatazz', city: 'Barcelona', address: 'Carrer dels Almogàvers, 122', capacity: 3000, description: 'Sala de conciertos y discoteca.' }
];

// Artistas nuevos por categoría. Reguetón no recibe artistas nuevos.
// Estopa ya existe en Rock; estos cuatro completan Rock hasta 5.
const newArtistsByCategory = {
  Rock: ['Héroes del Silencio', 'Extremoduro', 'Rosendo', 'Hombres G'],
  Pop: ['Alejandro Sanz', 'Melendi', 'Pablo Alborán', 'Aitana', 'Rosalía'],
  Rap: ['Nach', 'C. Tangana', 'Kendrick Lamar', 'Eminem', 'Drake'],
  Electrónica: ['Martin Garrix', 'David Guetta', 'Calvin Harris', 'Armin van Buuren', 'Afrojack'],
  'Salsa y Latina': ['Marc Anthony', 'Juan Luis Guerra', 'Gloria Estefan', 'Romeo Santos', 'Oscar D\'León'],
  Flamenco: ['Estrella Morente', 'Niña Pastori', 'Vicente Amigo', 'Diego El Cigala', 'Miguel Poveda']
};

// Categorías nuevas. Si ya existen con ese nombre, no se duplican.
const newCategories = [
  { name: 'Salsa y Latina', description: 'Salsa, merengue, bachata y música latina.' },
  { name: 'Flamenco', description: 'Flamenco y cante jondo.' }
];

// Variantes con la misma forma que las de tu seed: VIP, Pista y Grada
const variantTemplates = [
  { name: 'VIP', description: 'Acceso preferente y zona VIP', factor: 2.5, quantity: 50 },
  { name: 'Pista', description: 'Entrada de pista general', factor: 1, quantity: 300 },
  { name: 'Grada', description: 'Entrada de grada numerada', factor: 0.6, quantity: 500 }
];

const uniqueSlug = async (Model, base) => {
  const root = generateSlug(base) || 'item';
  let slug = root;
  let suffix = 2;

  while (await Model.exists({ slug })) {
    slug = `${root}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

const seedVenues = async () => {
  let created = 0;

  for (const venue of venues) {
    if (await Venue.exists({ name: venue.name })) continue;

    await Venue.create({
      name: venue.name,
      slug: await uniqueSlug(Venue, venue.name),
      description: venue.description ?? `Recinto de conciertos en ${venue.city}.`,
      address: venue.address,
      city: venue.city,
      capacity: venue.capacity,
      images: [],
      website: '',
      status: 'active',
      isActive: true,
      deletedAt: null
    });
    created += 1;
  }

  console.log(`Salas reales preparadas. Creadas: ${created}.`);
  return Venue.find({ isActive: true, deletedAt: null }).sort({ name: 1 });
};

const seedCategories = async () => {
  let created = 0;

  for (const category of newCategories) {
    if (await Category.exists({ name: category.name })) continue;

    await Category.create({
      name: category.name,
      slug: await uniqueSlug(Category, category.name),
      description: category.description,
      images: [],
      isActive: true,
      deletedAt: null
    });
    created += 1;
  }

  console.log(`Categorías nuevas preparadas. Creadas: ${created}.`);
};

const seedArtistsAndConcerts = async (venueList) => {
  let artistsCreated = 0;
  let concertsCreated = 0;
  let index = 0;

  for (const [categoryName, names] of Object.entries(newArtistsByCategory)) {
    const category = await Category.findOne({ name: categoryName, deletedAt: null });
    if (!category) {
      console.log(`Aviso: no existe la categoría "${categoryName}". Se omiten sus artistas.`);
      continue;
    }

    for (const name of names) {
      index += 1;

      let artist = await Artist.findOne({ name }).setOptions({ includeDeleted: true });
      if (!artist) {
        artist = await Artist.create({
          name,
          slug: await uniqueSlug(Artist, name),
          bio: '',
          socials: [],
          images: [],
          isActive: true,
          deletedAt: null
        });
        artistsCreated += 1;
      }

      // Concierto del artista con 1 o 2 sesiones (alternando)
      const existingConcert = await Concert.findOne({ title: name }).setOptions({ includeDeleted: true });
      if (existingConcert) continue;

      const sessionCount = index % 2 === 0 ? 1 : 2;
      const concert = await Concert.create({
        title: name,
        description: `Concierto de ${name} en Ritmo.`,
        artistIds: [artist._id],
        categoryIds: [category._id],
        slug: await uniqueSlug(Concert, name),
        status: 'scheduled',
        isActive: true,
        deletedAt: null
      });
      concertsCreated += 1;

      for (let s = 0; s < sessionCount; s += 1) {
        const venue = venueList[(index * 2 + s) % venueList.length];
        const startsAt = new Date(Date.UTC(2027, (index + s) % 12, ((index * 3 + s) % 27) + 1, 21, 0, 0));
        const dayText = startsAt.toISOString().slice(0, 10);
        const basePrice = 25 + ((index + s) % 6) * 5;

        const performance = await Performance.create({
          concertId: concert._id,
          slug: await uniqueSlug(Performance, `${name}-${venue.city}-${dayText}`),
          venueId: venue._id,
          city: venue.city,
          startsAt,
          endsAt: null,
          price: basePrice,
          bookedParticipants: 0,
          status: 'scheduled',
          isActive: true,
          artistIds: [artist._id]
        });

        for (const template of variantTemplates) {
          await Variant.create({
            performanceId: performance._id,
            name: template.name,
            description: template.description,
            price: Math.round(basePrice * template.factor * 100) / 100,
            quantity: template.quantity,
            sold: 0,
            sku: generateSku(performance._id, performance.startsAt),
            slug: `${performance.slug}-${generateSlug(template.name)}`
          });
        }
      }
    }
  }

  console.log(`Artistas nuevos: ${artistsCreated}. Conciertos nuevos: ${concertsCreated}.`);
};

// Carga todos los datos de la tienda. La usa seed.js y también este archivo por separado.
const seedShopData = async () => {
  await seedCategories();
  const venueList = await seedVenues();
  await seedArtistsAndConcerts(venueList);
};

// Solo si se ejecuta directamente con `npm run seed:shop`
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedShopData();
      console.log('Datos de la tienda preparados.');
    } catch (error) {
      console.error('Error en el seeder de la tienda:', error.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}

module.exports = { seedShopData };
