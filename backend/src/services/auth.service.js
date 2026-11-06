const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const profileRepository = require('../repositories/profile.repository');
const revokedTokenRepository = require('../repositories/revoked-token.repository');
const profileService = require('./profile.service');
const AppError = require('../utils/app-error');
const { hashPassword, verifyPassword } = require('../utils/password.util');
const { signAccessToken, getJwtExpiresIn } = require('../utils/jwt.util');
const { resolveUserRole } = require('../utils/role.util');
const { generateSlug } = require('../utils/slug.util');

class AuthService {
  async register(payload) {
    const email = payload.email.trim().toLowerCase();

    if (await userRepository.findByEmail(email)) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    const customerRole = await roleRepository.findByName('customer');
    if (!customerRole || !customerRole.isActive || customerRole.deletedAt) {
      throw new AppError('El rol de cliente no está disponible', 500);
    }

    const user = await userRepository.create({
      name: payload.name.trim(),
      email,
      slug: await this.#buildUniqueSlug(payload.name),
      passwordHash: await hashPassword(payload.password),
      roleId: customerRole._id,
      status: 'active',
      isActive: true
    });

    const profile = await profileService.createProfile(user._id, {});

    return this.#buildSession(user, profile);
  }

  async login(payload) {
    const email = payload.email.trim().toLowerCase();

    const user = await userRepository.findByEmailForLogin(email);
    const validPassword = user ? await verifyPassword(payload.password, user.passwordHash) : false;

    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive || user.status === 'blocked') {
      throw new AppError('Authentication required', 401);
    }

    const profile = await profileRepository.findByUserId(user._id);

    return this.#buildSession(user, profile);
  }

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Authentication required', 401);

    const profile = await profileRepository.findByUserId(user._id);

    return { user: user.toJSON(), profile };
  }

  async logout({ tokenId, tokenExp }) {
    // Los tokens emitidos antes de añadir jti no se pueden revocar: caducan solos
    if (tokenId && tokenExp) {
      await revokedTokenRepository.revoke(tokenId, new Date(tokenExp * 1000));
    }

    return null;
  }

  #buildSession(user, profile) {
    const token = signAccessToken({
      sub: String(user._id),
      role: resolveUserRole(user),
      email: user.email
    });

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: getJwtExpiresIn(),
      user: user.toJSON(),
      profile
    };
  }

  async #buildUniqueSlug(name) {
    const baseSlug = generateSlug(name) || 'usuario';
    let candidate = baseSlug;
    let suffix = 2;

    while (await userRepository.slugExists(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}

module.exports = new AuthService();
