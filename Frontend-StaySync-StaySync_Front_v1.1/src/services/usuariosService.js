import apiClient from './apiClient';
import { isDemoUser, validateDemoPassword } from './authService';

export const getUsuarios    = ()        => apiClient.get('/usuarios').then(r => r.data);
export const getHuespedes   = ()        => apiClient.get('/usuarios/huespedes').then(r => r.data);
export const buscarUsuarios = (q, rol)  => apiClient.get('/usuarios/buscar', { params: { q: q ?? '', rol: rol ?? '' } }).then(r => r.data);
export const getPerfil      = (id)      => apiClient.get(`/usuarios/${id}`).then(r => r.data);

// Perfil propio — usa el JWT para identificar al usuario (accesible para cualquier rol)
export const getPerfilPropio = () => apiClient.get('/usuarios/perfil').then(r => r.data);

export async function updatePerfilPropio(email, passwordActual, campos) {
  if (isDemoUser(email)) {
    if (!validateDemoPassword(email, passwordActual)) {
      const err = new Error('Contraseña incorrecta.');
      err.response = { data: { message: 'Contraseña incorrecta.' } };
      throw err;
    }
    return campos;
  }
  return apiClient.put('/usuarios/perfil', campos).then(r => r.data);
}

export async function updatePerfil(id, { email, passwordActual, ...campos }) {
  if (isDemoUser(email)) {
    if (!validateDemoPassword(email, passwordActual)) {
      const err = new Error('Contraseña incorrecta.');
      err.response = { data: { message: 'Contraseña incorrecta.' } };
      throw err;
    }
    return campos;
  }
  return apiClient.put(`/usuarios/${id}`, { ...campos, passwordActual }).then(r => r.data);
}
