const mongoose = require('mongoose');
const imageRepository = require('../repositories/image.repository');
const concertRepository = require('../repositories/concert.repository');
const performanceRepository = require('../repositories/performance.repository');
const artistRepository = require('../repositories/artist.repository');
const categoryRepository = require('../repositories/category.repository');
const AppError = require('../utils/app-error');

const MAX_URLS_PER_REQUEST = 20;

class ImageService {
  async createImages(payload) {
    const { concertId, performanceId, artistId, categoryId, urls, alt = '' } = payload;

    this.#validateOwner(concertId, performanceId, artistId, categoryId);

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new AppError('Indica al menos una URL', 400);
    }
    if (urls.length > MAX_URLS_PER_REQUEST) {
      throw new AppError(`Como máximo se pueden añadir ${MAX_URLS_PER_REQUEST} URLs a la vez`, 400);
    }

    await this.#ensureOwnerExists(concertId, performanceId, artistId, categoryId);

    const docs = urls.map((url) => ({
      url,
      alt,
      concertId: concertId || null,
      performanceId: performanceId || null,
      artistId: artistId || null,
      categoryId: categoryId || null
    }));

    const created = await imageRepository.createMany(docs);
    await this.#addToOwner(concertId, performanceId, artistId, categoryId, urls);

    return created;
  }

  async getImages(concertId, performanceId, artistId, categoryId) {
    this.#validateOwner(concertId, performanceId, artistId, categoryId);

    const filter = concertId
      ? { concertId }
      : performanceId
        ? { performanceId }
        : categoryId
          ? { categoryId }
          : { artistId };
    return imageRepository.findByOwner(filter);
  }

  async deleteImage(id) {
    this.#validateObjectId(id);

    const deleted = await imageRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Imagen no encontrada o ya eliminada', 404);

    await this.#removeFromOwner(deleted);

    return deleted;
  }

  async #ensureOwnerExists(concertId, performanceId, artistId, categoryId) {
    if (concertId) {
      const concert = await concertRepository.findById(concertId, true);
      if (!concert) throw new AppError('Concierto no encontrado', 404);
      return;
    }

    if (performanceId) {
      const performance = await performanceRepository.findById(performanceId, true);
      if (!performance) throw new AppError('Sesión no encontrada', 404);
      return;
    }

    if (categoryId) {
      const category = await categoryRepository.findById(categoryId, true);
      if (!category) throw new AppError('Categoría no encontrada', 404);
      return;
    }

    const artist = await artistRepository.findById(artistId, true);
    if (!artist) throw new AppError('Artista no encontrado', 404);
  }

  async #addToOwner(concertId, performanceId, artistId, categoryId, urls) {
    if (concertId) return concertRepository.addImages(concertId, urls);
    if (performanceId) return performanceRepository.addImages(performanceId, urls);
    if (categoryId) return categoryRepository.addImages(categoryId, urls);
    return artistRepository.addImages(artistId, urls);
  }

  async #removeFromOwner(image) {
    if (image.concertId) return concertRepository.removeImage(image.concertId, image.url);
    if (image.performanceId) return performanceRepository.removeImage(image.performanceId, image.url);
    if (image.categoryId) return categoryRepository.removeImage(image.categoryId, image.url);
    return artistRepository.removeImage(image.artistId, image.url);
  }

  #validateOwner(concertId, performanceId, artistId, categoryId) {
    const provided = [concertId, performanceId, artistId, categoryId].filter(Boolean).length;
    if (provided !== 1) {
      throw new AppError('Indica exactamente uno: concertId, performanceId, artistId o categoryId', 400);
    }

    if (concertId) this.#validateObjectId(concertId, 'concertId no es válido');
    if (performanceId) this.#validateObjectId(performanceId, 'performanceId no es válido');
    if (artistId) this.#validateObjectId(artistId, 'artistId no es válido');
    if (categoryId) this.#validateObjectId(categoryId, 'categoryId no es válido');
  }

  #validateObjectId(id, message = 'El ID de la imagen no es válido') {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(message, 400);
  }
}

module.exports = new ImageService();
