import apiClient from './apiClient';

export const getHabitaciones      = ()         => apiClient.get('/habitaciones').then(r => r.data);
export const getDisponibles       = ()         => apiClient.get('/habitaciones/disponibles').then(r => r.data);
export const getHabitacionById    = (id)       => apiClient.get(`/habitaciones/${id}`).then(r => r.data);
export const cambiarEstado        = (id, body) => apiClient.patch(`/habitaciones/${id}/estado`, body).then(r => r.data);
