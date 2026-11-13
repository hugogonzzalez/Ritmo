const mongoose = require('mongoose');
const profileRepository = require('../repositories/profile.repository');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/app-error');
const { generateSlug } = require('../utils/slug.util');

const EDITABLE_FIELDS = ['firstName', 'lastName', 'phone', 'bio', 'avatarUrl'];
const USER_NAME_MAX_LENGTH = 80;

// Solo se guardan los campos del perfil: nunca el userId ni otros datos
const pickEditableFields = (payload) => Object.fromEntries(
  EDITABLE_FIELDS.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]])
);

// Nombre completo a partir de nombre y apellidos (ignora los vacíos)
const buildFullName = (firstName, lastName) => [firstName, lastName]
  .map((part) => (typeof part === 'string' ? part.trim() : ''))
  .filter(Boolean)
  .join(' ');

class ProfileService {
  async getProfileByUserId(userId) {
    await this.#ensureUserExists(userId);

    const profile = await profileRepository.findByUserId(userId);

    return profile ?? { userId: String(userId), firstName: null, lastName: null, phone: null, bio: null, avatarUrl: null };
  }

  async upsertProfileByUserId(userId, payload) {
    const user = await this.#ensureUserExists(userId);
    const data = pickEditableFields(payload);
    const nameChanged = data.firstName !== undefined || data.lastName !== undefined;

    // Si cambian nombre o apellidos, el nombre de la cuenta debe seguir al perfil.
    // Se calcula y valida antes de guardar nada, para no dejar los dos datos desincronizados.
    let fullName = null;
    if (nameChanged) {
      const current = await profileRepository.findByUserId(userId);
      fullName = buildFullName(
        data.firstName !== undefined ? data.firstName : current?.firstName,
        data.lastName !== undefined ? data.lastName : current?.lastName
      );

      if (fullName.length > USER_NAME_MAX_LENGTH) {
        throw new AppError(`El nombre completo no puede superar ${USER_NAME_MAX_LENGTH} caracteres`, 400);
      }
    }

    const profile = await profileRepository.upsertByUserId(userId, data);

    // Un nombre vacío no sustituye al de la cuenta
    if (fullName && fullName !== user.name) {
      await userRepository.updateById(userId, {
        name: fullName,
        slug: await this.#buildUniqueSlug(fullName, userId)
      });
    }

    return profile;
  }

  // Listado de administración: solo perfiles cuyo usuario todavía existe
  // Listado paginado para el panel de admin
  async listProfilesPage(query) {
    return profileRepository.findPage(query);
  }

  async listProfiles() {
    const profiles = await profileRepository.findAllWithUser();
    return profiles.filter((profile) => profile.userId);
  }

  // Se llama al activar o desactivar el usuario: el perfil sigue su mismo estado
  async setActiveByUserId(userId, isActive) {
    return profileRepository.setActiveByUserId(userId, isActive);
  }

  // Alta del perfil al crear el usuario. El usuario acaba de crearse, así que no se vuelve a comprobar.
  async createProfile(userId, payload = {}) {
    return profileRepository.upsertByUserId(userId, pickEditableFields(payload));
  }

  async #ensureUserExists(userId) {
    if (!mongoose.isValidObjectId(userId)) throw new AppError('El ID del usuario no es válido', 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    return user;
  }

  // Mismo criterio que en user.service: slug único, añadiendo -2, -3... si ya existe
  async #buildUniqueSlug(name, excludeId) {
    const baseSlug = generateSlug(name) || 'usuario';
    let candidate = baseSlug;
    let suffix = 2;

    while (await userRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}

module.exports = new ProfileService();
