import apiClient from './apiClient';

export const getUsuarios  = ()        => apiClient.get('/usuarios').then(r => r.data);
export const getPerfil    = (id)      => apiClient.get(`/usuarios/${id}`).then(r => r.data);
export const updatePerfil = (id, body)=> apiClient.put(`/usuarios/${id}`, body).then(r => r.data);
