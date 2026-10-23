const Role = require('../models/role.model');

class RoleRepository {
  async create(data) {
    return Role.create(data);
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return Role.find(filter).sort({ name: 1 });
  }

  async findById(id, includeInactive = false) {
    const filter = { _id: id };

    if (!includeInactive) filter.isActive = true;
    return Role.findOne(filter);
  }

  async findByIdWithDeleted(id) {
    return Role.findOne({ _id: id }).setOptions({ includeDeleted: true });
  }

  async findBySlug(slug, includeInactive = false) {
    const filter = { slug };

    if (!includeInactive) filter.isActive = true;
    return Role.findOne(filter);
  }

  // El nombre sigue reservado aunque el rol esté borrado lógicamente
  async findByName(name, excludeId) {
    const filter = { name };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return Role.findOne(filter).setOptions({ includeDeleted: true }).select('_id name');
  }

  async updateById(id, payload) {
    return Role.findOneAndUpdate({ _id: id }, payload, { new: true, runValidators: true });
  }

  async softDeleteById(id) {
    return Role.findOneAndUpdate(
      { _id: id },
      { isActive: false, deletedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async restoreById(id) {
    return Role.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { isActive: true, deletedAt: null },
      { new: true, runValidators: true }
    ).setOptions({ includeDeleted: true });
  }

  async setActiveById(id, isActive) {
    const role = await Role.findById(id).setOptions({ includeDeleted: true });

    if (!role) {
      return null;
    }

    if (role.isActive !== isActive || (isActive && role.deletedAt)) {
      role.isActive = isActive;

      if (isActive) {
        role.deletedAt = null;
      }

      await role.save();
    }

    return Role.findById(id).setOptions({ includeDeleted: true });
  }

  async slugExists(slug, excludeId) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await Role.findOne(filter).setOptions({ includeDeleted: true }).select('_id');
    return Boolean(existing);
  }
}

module.exports = new RoleRepository();
