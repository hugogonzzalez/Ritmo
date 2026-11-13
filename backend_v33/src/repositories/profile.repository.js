const Profile = require('../models/profile.model');

const { parseListParams, buildSearchFilter, buildActiveFilter, runPaginatedQuery, parseOptionalPrice, parseDateParam } = require('../utils/admin-list.util');

// Criterios de orden permitidos para este listado
const PROFILE_SORT = { name_asc: { firstName: 1, lastName: 1 }, name_desc: { firstName: -1, lastName: -1 } };

class ProfileRepository {
  async findByUserId(userId) {
    return Profile.findOne({ userId });
  }

  async upsertByUserId(userId, data) {
    return Profile.findOneAndUpdate(
      { userId },
      { $set: data, $setOnInsert: { userId } },
      { new: true, upsert: true, runValidators: true }
    );
  }

  // Todos los perfiles con los datos básicos de su usuario (para el listado de administración)
  // Listado del panel de admin: búsqueda, activos, orden y paginación
  async findPage(query) {
    const { page, limit, search, active, sort } = parseListParams(query, PROFILE_SORT, 'name_asc');
    const filter = {
      ...buildActiveFilter(active),
      ...buildSearchFilter(search, ['firstName', 'lastName', 'phone']),
    };
    return runPaginatedQuery({ model: Profile, filter, sort, page, limit, populate: (q) => q.populate('userId', 'name email slug status isActive') });
  }

  async findAllWithUser() {
    return Profile.find()
      .populate('userId', 'name email slug status isActive')
      .sort({ firstName: 1 });
  }

  async setActiveByUserId(userId, isActive) {
    return Profile.updateOne({ userId }, { $set: { isActive } });
  }
}

module.exports = new ProfileRepository();
