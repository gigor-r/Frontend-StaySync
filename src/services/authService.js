import apiClient from './apiClient';

/**
 * Authenticate a user.
 * @returns {Promise<AuthResponse>} Auth payload from BFF.
 */
export async function login(email, password) {
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
