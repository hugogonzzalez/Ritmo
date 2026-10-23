const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const { generateSlug } = require('../utils/slug.util');
const { hashPassword } = require('../utils/password.util');
const AppError = require('../utils/app-error');

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

class UserService {
  async createUser(payload) {
    const email = this.#normalizeEmail(payload.email);
    this.#validatePassword(payload.password);
    await this.#validateRole(payload.roleId);

    if (await userRepository.findByEmail(email)) throw new AppError('Ya existe un usuario con ese email', 409);

    const { password, ...data } = payload;
    delete data.slug;
    delete data.passwordHash;

    const slug = await this.#buildUniqueSlug(payload.name);
    const passwordHash = await hashPassword(password);

    return userRepository.create({ ...data, email, slug, passwordHash });
  }

  async getAllUsers(includeInactive = false) {
    return userRepository.findAll(includeInactive);
  }

  async getUserById(id, includeInactive = false) {
    this.#validateObjectId(id);

    const user = await userRepository.findById(id, includeInactive);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    return user;
  }

  async getUserBySlug(slug, includeInactive = false) {
    const user = await userRepository.findBySlug(slug, includeInactive);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    return user;
  }

  async updateUser(id, payload) {
    this.#validateObjectId(id);

    const current = await userRepository.findById(id, true);
    if (!current) throw new AppError('Usuario no encontrado', 404);

    const data = { ...payload };
    delete data.slug;
    delete data.passwordHash;
    delete data.password;

    if (payload.email !== undefined) {
      data.email = this.#normalizeEmail(payload.email);

      if (await userRepository.findByEmail(data.email, id)) throw new AppError('Ya existe un usuario con ese email', 409);
    }

    if (payload.roleId !== undefined) {
      await this.#validateRole(payload.roleId);
    }

    if (payload.password !== undefined) {
      this.#validatePassword(payload.password);
      data.passwordHash = await hashPassword(payload.password);
    }

    if (payload.name !== undefined) {
      data.slug = await this.#buildUniqueSlug(payload.name, id);
    }

    const updated = await userRepository.updateById(id, data);
    if (!updated) throw new AppError('Usuario no encontrado', 404);

    return updated;
  }

  async setActiveUser(id, isActive) {
    this.#validateObjectId(id);

    const user = await userRepository.setActiveById(id, isActive);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    return user;
  }

  async deleteUser(id) {
    this.#validateObjectId(id);

    const deleted = await userRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Usuario no encontrado o ya eliminado', 404);

    return deleted;
  }

  async restoreUser(id) {
    this.#validateObjectId(id);

    const deleted = await userRepository.findByIdWithDeleted(id);
    if (!deleted) throw new AppError('Usuario no encontrado', 404);
    if (!deleted.deletedAt) throw new AppError('El usuario no está eliminado', 409);

    // Otro usuario puede haber tomado el email mientras estaba borrado
    if (await userRepository.findByEmail(deleted.email, id)) throw new AppError('No se puede restaurar: el email ya lo usa otro usuario', 409);

    const restored = await userRepository.restoreById(id);
    if (!restored) throw new AppError('Usuario no encontrado o no está eliminado', 404);

    return restored;
  }

  // Clave ajena: el rol debe existir y estar activo
  async #validateRole(roleId) {
    if (!mongoose.Types.ObjectId.isValid(roleId)) throw new AppError('El rol no es válido', 400);

    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('El rol no existe o está inactivo', 400);
  }

  #normalizeEmail(email) {
    if (typeof email !== 'string') throw new AppError('El email no es válido', 400);

    return email.trim().toLowerCase();
  }

  #validatePassword(password) {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      throw new AppError(`La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`, 400);
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new AppError('La contraseña debe incluir al menos una letra y un número', 400);
    }
  }

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

  #validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('El ID del usuario no es válido', 400);
    }
  }
}

module.exports = new UserService();
