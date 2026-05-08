import apiClient from './apiClient';

const DEMO_USERS = {
  'admin@staysync.com': {
    password: 'Admin@1234',
    userId: 1,
    nombreCompleto: 'Admin StaySync',
    rol: 'ADMIN',
  },
  'recep@staysync.com': {
    password: 'Recep@1234',
    userId: 2,
    nombreCompleto: 'Recepcionista StaySync',
    rol: 'RECEPCIONISTA',
  },
  'huesped@staysync.com': {
    password: 'Huesped@1234',
    userId: 3,
    nombreCompleto: 'Huésped Demo',
    rol: 'HUESPED',
  },
};

export function validateDemoPassword(email, password) {
  const demo = DEMO_USERS[email?.toLowerCase()];
  return !!demo && demo.password === password;
}

export function isDemoUser(email) {
  return Object.prototype.hasOwnProperty.call(DEMO_USERS, email?.toLowerCase() ?? '');
}

function mockAuthResponse(email, user) {
  return {
    accessToken: `demo-access-token-${user.userId}`,
    refreshToken: `demo-refresh-token-${user.userId}`,
    tokenType: 'Bearer',
    expiresIn: 86400000,
    userId: user.userId,
    nombreCompleto: user.nombreCompleto,
    email,
    rol: user.rol,
  };
}

/**
 * Authenticate a user.
 * @returns {Promise<AuthResponse>} Auth payload from BFF.
 */
export async function login(email, password) {
  const demo = DEMO_USERS[email?.toLowerCase()];
  if (demo && demo.password === password) {
    return mockAuthResponse(email, demo);
  }

  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

/**
 * Register a new user.
 * @returns {Promise<UsuarioResponse>} Created user from BFF.
 */
export async function register({ nombre, apellido, email, password, telefono, rol = 'HUESPED' }) {
  const { data } = await apiClient.post('/auth/registro', {
    nombre, apellido, email, password, telefono, rol,
  });
  return data;
}

/**
 * Refresh the access token using the stored refresh token.
 * @returns {Promise<AuthResponse>}
 */
export async function refreshToken(token) {
  const { data } = await apiClient.post('/auth/refresh', { refreshToken: token });
  return data;
}

/**
 * Invalidate the refresh token on the server (logout).
 */
export async function logoutServer(token) {
  await apiClient.post('/auth/logout', { refreshToken: token });
}
