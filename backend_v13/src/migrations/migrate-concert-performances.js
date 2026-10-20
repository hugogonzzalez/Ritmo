require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Concert = require('../models/concert.model');
const Performance = require('../models/performance.model');
const { generateSlug } = require('../utils/slug.util');

// Capacidad provisional: cámbiala después con PUT /api/performances/:id
const DEFAULT_CAPACITY = 1000;
const STATUS_VALUES = ['scheduled', 'full', 'cancelled', 'completed'];

const migrate = async () => {
  try {
    await connectDB();

    // Documentos con el formato antiguo: todavía tienen date, venue, city y price
    const oldConcerts = await Concert.collection.find({ date: { $exists: true } }).toArray();

    let createdCount = 0;
    let skippedCount = 0;

    for (const old of oldConcerts) {
      const alreadyMigrated = await Performance.exists({ concertId: old._id });

      if (alreadyMigrated) {
        skippedCount += 1;
      } else {
        const dayText = new Date(old.date).toISOString().slice(0, 10);
        const baseSlug = generateSlug(`${old.title}-${old.city}-${dayText}`) || 'sesion';
        let slug = baseSlug;
        let suffix = 2;

        while (await Performance.exists({ slug })) {
          slug = `${baseSlug}-${suffix}`;
          suffix += 1;
        }

        await Performance.create({
          concertId: old._id,
          slug,
          venue: old.venue,
          city: old.city,
          startsAt: old.date,
          endsAt: null,
          capacity: DEFAULT_CAPACITY,
          price: old.price,
          bookedParticipants: 0,
          status: STATUS_VALUES.includes(old.status) ? old.status : 'scheduled',
          isActive: old.isActive !== false,
          deletedAt: old.deletedAt || null
        });

        createdCount += 1;
      }

      // Quita de concerts los campos que ahora viven en performances
      await Concert.collection.updateOne(
        { _id: old._id },
        { $unset: { venue: '', city: '', date: '', price: '' } }
      );
    }

    console.log(
      JSON.stringify({ concertsFound: oldConcerts.length, performancesCreated: createdCount, skipped: skippedCount }, null, 2)
    );
  } catch (error) {
    console.error('Migración fallida:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrate();
