require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Comment = require('../models/comment.model');

// Crea la colección "comments" (la "tabla") y sus índices, aunque todavía no haya comentarios.
// Es seguro ejecutarlo varias veces: si ya existe, no hace nada.
const crearColeccionComentarios = async () => {
  try {
    await connectDB();

    const existe = await mongoose.connection.db
      .listCollections({ name: Comment.collection.collectionName })
      .hasNext();

    if (existe) {
      console.log(`La colección "${Comment.collection.collectionName}" ya existe.`);
    } else {
      await Comment.createCollection();
      console.log(`Colección "${Comment.collection.collectionName}" creada.`);
    }

    // Crea los índices (incluido el de concierto + usuario, que impide valorar dos veces)
    await Comment.syncIndexes();
    console.log('Índices de comentarios preparados.');
  } catch (error) {
    console.error('Error al crear la colección de comentarios:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

crearColeccionComentarios();
