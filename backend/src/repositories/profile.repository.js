const Profile = require('../models/profile.model');

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
