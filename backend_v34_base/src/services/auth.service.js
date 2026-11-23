const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const profileRepository = require('../repositories/profile.repository');
const revokedTokenRepository = require('../repositories/revoked-token.repository');
const refreshTokenRepository = require('../repositories/refresh-token.repository');
const profileService = require('./profile.service');
const AppError = require('../utils/app-error');
const { hashPassword, verifyPassword } = require('../utils/password.util');
const { signAccessToken } = require('../utils/jwt.util');
const { resolveUserRole } = require('../utils/role.util');
const { generateSlug } = require('../utils/slug.util');
const { REFRESH_TTL_MS, generarRefreshToken, hashRefreshToken } = require('../utils/refresh-token.util');

class AuthService {
  async register(payload) {
    const email = payload.email.trim().toLowerCase();

    if (await userRepository.findByEmail(email)) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    // Siempre cliente (customer): el rol no se toma del body
    const customerRole = await roleRepository.findActiveByName('customer');
    if (!customerRole) {
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

    // No inicia sesión: el usuario debe hacer login después de registrarse
    return { user: user.toJSON(), profile };
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

  // Nuevo access_token a partir de un refresh_token válido. El refresh usado queda revocado (rotación).
  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError('Authentication required', 401);

    const hash = hashRefreshToken(refreshToken);
    const registro = await refreshTokenRepository.findValidByHash(hash);
    if (!registro) throw new AppError('Authentication required', 401);

    const user = await userRepository.findById(registro.userId);
    if (!user || !user.isActive || user.status === 'blocked') {
      await refreshTokenRepository.revokeByHash(hash);
      throw new AppError('Authentication required', 401);
    }

    await refreshTokenRepository.revokeByHash(hash);
    const profile = await profileRepository.findByUserId(user._id);
    return this.#buildSession(user, profile);
  }

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Authentication required', 401);

    const profile = await profileRepository.findByUserId(user._id);

    return { user: user.toJSON(), profile };
  }

  async logout({ tokenId, tokenExp, refreshToken }) {
    // Los tokens emitidos antes de añadir jti no se pueden revocar: caducan solos
    if (tokenId && tokenExp) {
      await revokedTokenRepository.revoke(tokenId, new Date(tokenExp * 1000));
    }

    // Sin el refresh_token no se puede renovar la sesión
    if (refreshToken) {
      await refreshTokenRepository.revokeByHash(hashRefreshToken(refreshToken));
    }

    return null;
  }

  async #buildSession(user, profile) {
    const accessToken = signAccessToken({
      sub: String(user._id),
      role: resolveUserRole(user),
      email: user.email
    });

    const refreshToken = generarRefreshToken();
    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
    });

    return { accessToken, refreshToken, user: user.toJSON(), profile };
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
