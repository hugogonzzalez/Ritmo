const roleService = require('../services/role.service');

class RoleController {
  async create(req, res, next) {
    try {
      const role = await roleService.createRole(req.body);
      return res.status(201).json({ success: true, message: 'Role created successfully', data: role });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const roles = await roleService.getAllRoles(includeInactive);
      return res.status(200).json({ success: true, message: 'Roles fetched successfully', data: roles });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const role = await roleService.getRoleById(req.params.id, includeInactive);
      return res.status(200).json({ success: true, message: 'Role fetched successfully', data: role });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const role = await roleService.getRoleBySlug(req.params.slug, includeInactive);
      return res.status(200).json({ success: true, message: 'Role fetched successfully', data: role });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const role = await roleService.updateRole(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Role updated successfully', data: role });
    } catch (error) {
      return next(error);
    }
  }

  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive;
      const role = await roleService.setActiveRole(req.params.id, isActive);

      return res.status(200).json({
        success: true,
        message: isActive ? 'Role activated successfully' : 'Role deactivated successfully',
        data: role
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const role = await roleService.deleteRole(req.params.id);
      return res.status(200).json({ success: true, message: 'Role deleted successfully', data: role });
    } catch (error) {
      return next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const role = await roleService.restoreRole(req.params.id);
      return res.status(200).json({ success: true, message: 'Role restored successfully', data: role });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new RoleController();
