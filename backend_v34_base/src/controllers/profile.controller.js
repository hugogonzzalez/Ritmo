const profileService = require('../services/profile.service');

const { isPaginatedRequest } = require('../utils/admin-list.util');

class ProfileController {
  async list(req, res, next) {
    try {
      // Con parámetros de listado (búsqueda, página, orden...) se devuelve paginación
      if (isPaginatedRequest(req.query)) {
        const result = await profileService.listProfilesPage(req.query);
        return res.status(200).json({
          success: true,
          message: 'Profiles fetched successfully',
          data: result.data,
          pagination: result.pagination
        });
      }
      const profiles = await profileService.listProfiles();
      return res.status(200).json({ success: true, message: 'Profiles fetched successfully', data: profiles });
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await profileService.getProfileByUserId(req.user.id);
      return res.status(200).json({ success: true, message: 'Profile fetched successfully', data: profile });
    } catch (error) {
      return next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const profile = await profileService.upsertProfileByUserId(req.user.id, req.body);
      return res.status(200).json({ success: true, message: 'Profile updated successfully', data: profile });
    } catch (error) {
      return next(error);
    }
  }

  async getByUserId(req, res, next) {
    try {
      const profile = await profileService.getProfileByUserId(req.params.userId);
      return res.status(200).json({ success: true, message: 'Profile fetched successfully', data: profile });
    } catch (error) {
      return next(error);
    }
  }

  async updateByUserId(req, res, next) {
    try {
      const profile = await profileService.upsertProfileByUserId(req.params.userId, req.body);
      return res.status(200).json({ success: true, message: 'Profile updated successfully', data: profile });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ProfileController();
