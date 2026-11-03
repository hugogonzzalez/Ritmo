const mongoose = require('mongoose');
const artistRepository = require('../repositories/artist.repository');
const concertRepository = require('../repositories/concert.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');

class ArtistService {
  async createArtist(payload) {
    if (await artistRepository.findByName(payload.name)) throw new AppError('Ya existe un artista con ese nombre', 409);
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

    if (payload.name !== undefined && await artistRepository.findByName(payload.name, id)) throw new AppError('Ya existe un artista con ese nombre', 409);

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

    if (!isActive) await this.#ensureNoActiveConcerts(id, 'desactivar');

    const artist = await artistRepository.setActiveById(id, isActive);
    if (!artist) throw new AppError('Artista no encontrado', 404);

    return artist;
  }

  async #ensureNoActiveConcerts(id, action) {
    const concerts = await concertRepository.countActiveByArtist(id);
    if (concerts > 0) throw new AppError(`No puedes ${action} un artista con ${concerts} conciertos activos`, 409);
  }

  async deleteArtist(id) {
    this.#validateObjectId(id);

    await this.#ensureNoActiveConcerts(id, 'eliminar');

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
  async restoreArtist(id) {
    const restored = await artistRepository.restoreById(id);
    if (!restored) throw new AppError('Artista no encontrado o no está eliminado', 404);

    return restored;
  }

}

module.exports = new ArtistService();
