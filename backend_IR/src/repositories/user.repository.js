const User = require('../models/user.model');

class UserRepository {
  #basePopulate(query) {
    return query.populate('role', 'name slug');
  }

  async create(data) {
    const user = await User.create(data);
    return this.#basePopulate(User.findById(user._id));
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return this.#basePopulate(User.find(filter).sort({ name: 1 }));
  }

  async findById(id, includeInactive = false) {
    const filter = { _id: id };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(User.findOne(filter));
  }

  // Incluye usuarios borrados lógicamente (para restaurarlos)
  async findByIdWithDeleted(id) {
    return this.#basePopulate(User.findOne({ _id: id }).setOptions({ includeDeleted: true }));
  }

  async findBySlug(slug, includeInactive = false) {
    const filter = { slug };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(User.findOne(filter));
  }

  // El email sigue reservado aunque el usuario esté borrado lógicamente
  async findByEmail(email, excludeId) {
    const filter = { email };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return User.findOne(filter).setOptions({ includeDeleted: true }).select('_id email deletedAt');
  }

  async updateById(id, payload) {
    return this.#basePopulate(
      User.findOneAndUpdate({ _id: id }, payload, { new: true, runValidators: true })
    );
  }

  async softDeleteById(id) {
    return this.#basePopulate(
      User.findOneAndUpdate(
        { _id: id },
        { isActive: false, deletedAt: new Date() },
        { new: true, runValidators: true }
      )
    );
  }

  async restoreById(id) {
    return this.#basePopulate(
      User.findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { isActive: true, deletedAt: null },
        { new: true, runValidators: true }
      ).setOptions({ includeDeleted: true })
    );
  }

  async setActiveById(id, isActive) {
    const user = await User.findById(id).setOptions({ includeDeleted: true });

    if (!user) {
      return null;
    }

    if (user.isActive !== isActive || (isActive && user.deletedAt)) {
      user.isActive = isActive;

      if (isActive) {
        user.deletedAt = null;
      }

      await user.save();
    }

    return this.#basePopulate(User.findById(id).setOptions({ includeDeleted: true }));
  }

  async countActiveByRole(roleId) {
    return User.countDocuments({ roleId, isActive: true, deletedAt: null });
  }

  async assignRoleToUsersWithoutRole(roleId) {
    return User.updateMany({ roleId: null }, { roleId });
  }

  async slugExists(slug, excludeId) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await User.findOne(filter)
      .setOptions({ includeDeleted: true })
      .select('_id');

    return Boolean(existing);
  }
}

module.exports = new UserRepository();
