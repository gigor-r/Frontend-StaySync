import apiClient from './apiClient';

export const procesarPago       = (body)           => apiClient.post('/pagos', body).then(r => r.data);
export const getPago            = (id)             => apiClient.get(`/pagos/${id}`).then(r => r.data);
export const getPagosPorReserva = (reservaId)      => apiClient.get(`/pagos/reserva/${reservaId}`).then(r => r.data);
export const solicitarReembolso = (pagoId, body)   => apiClient.post(`/pagos/${pagoId}/reembolso`, body).then(r => r.data);
