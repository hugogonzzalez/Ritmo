const mongoose = require('mongoose');
const imageRepository = require('../repositories/image.repository');
const concertRepository = require('../repositories/concert.repository');
const performanceRepository = require('../repositories/performance.repository');
const artistRepository = require('../repositories/artist.repository');
const categoryRepository = require('../repositories/category.repository');
const venueRepository = require('../repositories/venue.repository');
const AppError = require('../utils/app-error');

const MAX_URLS_PER_REQUEST = 20;

// Dueños posibles de una imagen. `stores` indica qué guarda el dueño en su lista de imágenes:
// la URL (concierto, sesión, artista, categoría) o el _id de la imagen (sala, clave ajena).
const OWNERS = {
  concertId: { name: 'Concierto', notFound: 'Concierto no encontrado', repo: concertRepository, stores: 'url' },
  performanceId: { name: 'Sesión', notFound: 'Sesión no encontrada', repo: performanceRepository, stores: 'url' },
  artistId: { name: 'Artista', notFound: 'Artista no encontrado', repo: artistRepository, stores: 'url' },
  categoryId: { name: 'Categoría', notFound: 'Categoría no encontrada', repo: categoryRepository, stores: 'url' },
  venueId: { name: 'Sala', notFound: 'Sala no encontrada', repo: venueRepository, stores: 'id' }
};

const OWNER_KEYS = Object.keys(OWNERS);

class ImageService {
  async createImages(payload) {
    const { key, id } = this.#resolveOwner(payload);
    const { urls, alt = '' } = payload;

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new AppError('Indica al menos una URL', 400);
    }
    if (urls.length > MAX_URLS_PER_REQUEST) {
      throw new AppError(`Como máximo se pueden añadir ${MAX_URLS_PER_REQUEST} URLs a la vez`, 400);
    }

    await this.#ensureOwnerExists(key, id);

    const docs = urls.map((url) => ({ url, alt, ...this.#ownerFields(key, id) }));
    const created = await imageRepository.createMany(docs);

    const owner = OWNERS[key];
    const values = owner.stores === 'id' ? created.map((image) => image._id) : urls;
    await owner.repo.addImages(id, values);

    return created;
  }

  async getImages(query) {
    const { key, id } = this.#resolveOwner(query);
    return imageRepository.findByOwner({ [key]: id });
  }

  async deleteImage(id) {
    this.#validateObjectId(id);

    const deleted = await imageRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Imagen no encontrada o ya eliminada', 404);

    await this.#removeFromOwner(deleted);

    return deleted;
  }

  #ownerFields(key, id) {
    return Object.fromEntries(OWNER_KEYS.map((ownerKey) => [ownerKey, ownerKey === key ? id : null]));
  }

  #resolveOwner(payload) {
    const provided = OWNER_KEYS.filter((key) => payload[key]);

    if (provided.length !== 1) {
      throw new AppError(`Indica exactamente uno: ${OWNER_KEYS.join(', ')}`, 400);
    }

    const [key] = provided;
    this.#validateObjectId(payload[key], `${key} no es válido`);

    return { key, id: payload[key] };
  }

  async #ensureOwnerExists(key, id) {
    const owner = OWNERS[key];
    const found = await owner.repo.findById(id, true);

    if (!found) throw new AppError(owner.notFound, 404);
  }

  async #removeFromOwner(image) {
    const key = OWNER_KEYS.find((ownerKey) => image[ownerKey]);
    if (!key) return;

    const owner = OWNERS[key];
    const value = owner.stores === 'id' ? image._id : image.url;
    await owner.repo.removeImage(image[key], value);
  }

  #validateObjectId(id, message = 'El ID de la imagen no es válido') {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(message, 400);
  }
}

module.exports = new ImageService();
