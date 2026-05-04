import apiClient from './apiClient';

export const getServicios         = ()         => apiClient.get('/servicios/disponibles').then(r => r.data);
export const getSolicitudes       = ()         => apiClient.get('/servicios/solicitudes').then(r => r.data);
export const solicitarServicio    = (body)     => apiClient.post('/servicios/solicitudes', body).then(r => r.data);
export const actualizarSolicitud  = (id, body) => apiClient.patch(`/servicios/solicitudes/${id}/estado`, body).then(r => r.data);
