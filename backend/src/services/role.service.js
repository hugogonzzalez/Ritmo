const mongoose = require('mongoose');
const roleRepository = require('../repositories/role.repository');
const userRepository = require('../repositories/user.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');
const { ROLE_NAMES, PERMISSIONS } = require('../models/role.model');

class RoleService {
  async createRole(payload) {
    this.#validateName(payload.name);
    this.#validatePermissions(payload.permissions);

    if (await roleRepository.findByName(payload.name)) throw new AppError('Ya existe un rol con ese nombre', 409);

    const data = { ...payload };
    delete data.slug;

    const slug = await this.#buildUniqueSlug(payload.name);
    return roleRepository.create({ ...data, slug });
  }

  async getAllRoles(includeInactive = false) {
    return roleRepository.findAll(includeInactive);
  }

  async getRoleById(id, includeInactive = false) {
    this.#validateObjectId(id);

    const role = await roleRepository.findById(id, includeInactive);
    if (!role) throw new AppError('Rol no encontrado', 404);

    return role;
  }

  async getRoleBySlug(slug, includeInactive = false) {
    const role = await roleRepository.findBySlug(slug, includeInactive);
    if (!role) throw new AppError('Rol no encontrado', 404);

    return role;
  }

  async updateRole(id, payload) {
    this.#validateObjectId(id);

    const current = await roleRepository.findById(id, true);
    if (!current) throw new AppError('Rol no encontrado', 404);

    if (payload.name !== undefined) {
      this.#validateName(payload.name);
      if (await roleRepository.findByName(payload.name, id)) throw new AppError('Ya existe un rol con ese nombre', 409);
    }

    if (payload.permissions !== undefined) {
      this.#validatePermissions(payload.permissions);
    }

    const data = { ...payload };
    delete data.slug;

    if (payload.name !== undefined) {
      data.slug = await this.#buildUniqueSlug(payload.name, id);
    }

    const updated = await roleRepository.updateById(id, data);
    if (!updated) throw new AppError('Rol no encontrado', 404);

    return updated;
  }

  async setActiveRole(id, isActive) {
    this.#validateObjectId(id);

    if (!isActive) {
      await this.#ensureNoActiveUsers(id, 'desactivar');
    }

    const role = await roleRepository.setActiveById(id, isActive);
    if (!role) throw new AppError('Rol no encontrado', 404);

    return role;
  }

  async deleteRole(id) {
    this.#validateObjectId(id);
    await this.#ensureNoActiveUsers(id, 'eliminar');

    const deleted = await roleRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Rol no encontrado o ya eliminado', 404);

    return deleted;
  }

  async restoreRole(id) {
    this.#validateObjectId(id);

    const deleted = await roleRepository.findByIdWithDeleted(id);
    if (!deleted) throw new AppError('Rol no encontrado', 404);
    if (!deleted.deletedAt) throw new AppError('El rol no está eliminado', 409);

    if (await roleRepository.findByName(deleted.name, id)) throw new AppError('No se puede restaurar: ya existe otro rol con ese nombre', 409);

    const restored = await roleRepository.restoreById(id);
    if (!restored) throw new AppError('Rol no encontrado o no está eliminado', 404);

    return restored;
  }

  // Clave ajena: no se puede desactivar ni borrar un rol que tiene usuarios activos
  async #ensureNoActiveUsers(id, action) {
    const count = await userRepository.countActiveByRole(id);

    if (count > 0) {
      throw new AppError(`No puedes ${action} un rol con ${count} usuarios activos`, 409);
    }
  }

  #validateName(name) {
    if (!ROLE_NAMES.includes(name)) {
      throw new AppError(`El nombre del rol debe ser uno de: ${ROLE_NAMES.join(', ')}`, 400);
    }
  }

  #validatePermissions(permissions) {
    if (permissions === undefined) return;

    const unknown = permissions.filter((permission) => !PERMISSIONS.includes(permission));
    if (unknown.length > 0) {
      throw new AppError(`Permisos no válidos: ${unknown.join(', ')}`, 400);
    }
  }

  async #buildUniqueSlug(name, excludeId) {
    const baseSlug = generateSlug(name) || 'rol';
    let candidate = baseSlug;
    let suffix = 2;

    while (await roleRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  #validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('El ID del rol no es válido', 400);
    }
  }
}

module.exports = new RoleService();
