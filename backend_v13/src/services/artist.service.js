const mongoose = require('mongoose');
const artistRepository = require('../repositories/artist.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');

class ArtistService {
  async createArtist(payload) {
    const slug = await this.#buildUniqueSlug(payload.name);
    return artistRepository.create({ ...payload, slug });
  }

  async getAllArtists(includeInactive = false) {
    return artistRepository.findAll(includeInactive);
  }

  async getArtistById(id, includeInactive = false) {
    this.#validateObjectId(id);

    const artist = await artistRepository.findById(id, includeInactive);
    if (!artist) throw new AppError('Artista no encontrado', 404);

    return artist;
  }

  async getArtistBySlug(slug, includeInactive = false) {
    const artist = await artistRepository.findBySlug(slug, includeInactive);
    if (!artist) throw new AppError('Artista no encontrado', 404);

    return artist;
  }

  async updateArtist(id, payload) {
    this.#validateObjectId(id);

    const current = await artistRepository.findById(id, true);
    if (!current) throw new AppError('Artista no encontrado', 404);

    const data = { ...payload };
    delete data.slug;

    if (payload.name !== undefined) {
      data.slug = await this.#buildUniqueSlug(payload.name, id);
    }

    const updated = await artistRepository.updateById(id, data);
    if (!updated) throw new AppError('Artista no encontrado', 404);

    return updated;
  }

  async setActiveArtist(id, isActive) {
    this.#validateObjectId(id);

    const artist = await artistRepository.setActiveById(id, isActive);
    if (!artist) throw new AppError('Artista no encontrado', 404);

    return artist;
  }

  async deleteArtist(id) {
    this.#validateObjectId(id);

    const deleted = await artistRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Artista no encontrado o ya eliminado', 404);

    return deleted;
  }

  async #buildUniqueSlug(name, excludeId) {
    const baseSlug = generateSlug(name) || 'artista';
    let candidate = baseSlug;
    let suffix = 2;

    while (await artistRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  #validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('El ID del artista no es válido', 400);
    }
  }
}

module.exports = new ArtistService();
