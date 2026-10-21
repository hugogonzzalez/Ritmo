const Image = require('../models/image.model');

class ImageRepository {
  async createMany(docs) {
    return Image.insertMany(docs);
  }

  async findByOwner(filter) {
    return Image.find({ ...filter, isActive: true }).sort({ createdAt: 1 });
  }

  async softDeleteById(id) {
    return Image.findOneAndUpdate(
      { _id: id },
      { isActive: false, deletedAt: new Date() },
      { new: true, runValidators: true }
    );
  }
  async restoreById(id) {
    return Image.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { isActive: true, deletedAt: null },
      { new: true, runValidators: true }
    ).setOptions({ includeDeleted: true });
  }

}

module.exports = new ImageRepository();
