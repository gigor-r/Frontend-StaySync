import { useState, useEffect } from 'react';
import { useAuth }       from '../../context/AuthContext';
import { getMisReservas, cancelarReserva } from '../../services/reservasService';
import LoadingSpinner    from '../../components/common/LoadingSpinner';
import AlertMessage      from '../../components/common/AlertMessage';

const ESTADO_BADGE = {
  PENDIENTE:  'bg-warning text-dark',
  CONFIRMADA: 'bg-success',
  ACTIVA:     'bg-primary',
  CANCELADA:  'bg-secondary',
  FINALIZADA: 'bg-dark',
};

export default function ReservasHuesped() {
  const { user } = useAuth();
  const [reservas,   setReservas]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [canceling,  setCanceling]  = useState(null);

  useEffect(() => {
    getMisReservas(user?.id)
      .then(data => setReservas(Array.isArray(data) ? data : data.content ?? []))
      .catch(() => setError('Error al cargar reservas.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    setCanceling(id);
    try {
      await cancelarReserva(id);
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'CANCELADA' } : r));
    } catch {
      setError('No se pudo cancelar la reserva.');
    } finally {
      setCanceling(null);
    }
  };

  return (
    <div className="fade-in-up p-3 p-md-4">
      <h2 className="fw-bold mb-1" style={{ color: 'var(--ss-dark)' }}>
        <i className="bi bi-calendar-check me-2" style={{ color: 'var(--ss-gold)' }} />
        Mis reservas
      </h2>
      <p className="text-muted mb-4">Historial completo de tus reservas</p>

      <AlertMessage message={error} onClose={() => setError('')} />

      {loading
        ? <LoadingSpinner message="Cargando reservas..." />
        : reservas.length === 0
          ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-2" />
              No tienes reservas registradas.
            </div>
          )
          : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Habitación</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Huéspedes</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map(r => (
                    <tr key={r.id}>
                      <td className="text-muted small">#{r.id}</td>
                      <td className="fw-medium">Hab. {r.habitacionNumero ?? r.habitacionId}</td>
                      <td>{r.fechaEntrada ? new Date(r.fechaEntrada).toLocaleDateString('es-CO') : '—'}</td>
                      <td>{r.fechaSalida  ? new Date(r.fechaSalida).toLocaleDateString('es-CO')  : '—'}</td>
                      <td>{r.numHuespedes ?? '—'}</td>
                      <td>{r.total ? `$${r.total.toLocaleString()}` : '—'}</td>
                      <td>
                        <span className={`badge ${ESTADO_BADGE[r.estado] ?? 'bg-secondary'}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td>
                        {(r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={canceling === r.id}
                            onClick={() => handleCancelar(r.id)}
                          >
                            {canceling === r.id
                              ? <span className="spinner-border spinner-border-sm" />
                              : <i className="bi bi-x-circle" />
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }
    </div>
  );
}
