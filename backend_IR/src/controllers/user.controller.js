const userService = require('../services/user.service');

class UserController {
  async create(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const users = await userService.getAllUsers(includeInactive);
      return res.status(200).json({ success: true, message: 'Users fetched successfully', data: users });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const user = await userService.getUserById(req.params.id, includeInactive);
      return res.status(200).json({ success: true, message: 'User fetched successfully', data: user });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const user = await userService.getUserBySlug(req.params.slug, includeInactive);
      return res.status(200).json({ success: true, message: 'User fetched successfully', data: user });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) {
      return next(error);
    }
  }

  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive;
      const user = await userService.setActiveUser(req.params.id, isActive);

      return res.status(200).json({
        success: true,
        message: isActive ? 'User activated successfully' : 'User deactivated successfully',
        data: user
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const user = await userService.deleteUser(req.params.id);
      return res.status(200).json({ success: true, message: 'User deleted successfully', data: user });
    } catch (error) {
      return next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const user = await userService.restoreUser(req.params.id);
      return res.status(200).json({ success: true, message: 'User restored successfully', data: user });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
