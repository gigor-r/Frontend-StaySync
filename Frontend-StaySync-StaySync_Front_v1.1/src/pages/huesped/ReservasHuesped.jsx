import { useState, useEffect } from 'react';
import { useAuth }       from '../../context/AuthContext';
import { useNavigate }   from 'react-router-dom';
import { getMisReservas, cancelarReserva } from '../../services/reservasService';
import LoadingSpinner    from '../../components/common/LoadingSpinner';
import AlertMessage      from '../../components/common/AlertMessage';
import ModalConfirmarCancelacion from '../../components/common/ModalConfirmarCancelacion';

const ESTADO_BADGE = {
  PENDIENTE:  'bg-warning text-dark',
  CONFIRMADA: 'bg-success',
  CHECKIN:    'bg-primary',
  CHECKOUT:   'bg-dark',
  CANCELADA:  'bg-secondary',
  NO_SHOW:    'bg-danger',
};

const ESTADO_LABEL = {
  PENDIENTE:  'Pendiente',
  CONFIRMADA: 'Confirmada',
  CHECKIN:    'Activa',
  CHECKOUT:   'Finalizada',
  CANCELADA:  'Cancelada',
  NO_SHOW:    'No Show',
};

export default function ReservasHuesped() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [reservas,   setReservas]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [canceling,  setCanceling]  = useState(null);
  const [modalId,    setModalId]    = useState(null);

  const handlePagar = (r) => {
    navigate('/huesped/pago', {
      state: {
        reservaId:        r.id,
        codigo:           r.codigo,
        habitacionNumero: r.habitacionNumero ?? r.habitacionId,
        fechaEntrada:     r.fechaEntrada,
        fechaSalida:      r.fechaSalida,
        precioTotal:      r.precioTotal,
      },
    });
  };

  useEffect(() => {
    getMisReservas(user?.userId)
      .then(data => {
        const all = Array.isArray(data) ? data : data.content ?? [];
        setReservas(all.filter(r => r.estado !== 'CANCELADA'));
      })
      .catch(() => setError('Error al cargar reservas.'))
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const handleCancelar = async () => {
    setCanceling(modalId);
    try {
      await cancelarReserva(modalId);
      setReservas(prev => prev.filter(r => r.id !== modalId));
      setModalId(null);
    } catch {
      setError('No se pudo cancelar la reserva.');
      setModalId(null);
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

      <ModalConfirmarCancelacion
        show={modalId !== null}
        onClose={() => setModalId(null)}
        onConfirm={handleCancelar}
        loading={canceling !== null}
      />

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
                      <td>{r.precioTotal ? `$${Number(r.precioTotal).toLocaleString()}` : '—'}</td>
                      <td>
                        <span className={`badge ${ESTADO_BADGE[r.estado] ?? 'bg-secondary'}`}>
                          {ESTADO_LABEL[r.estado] ?? r.estado}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {r.estado === 'PENDIENTE' && (
                            <button
                              className="btn btn-sm fw-semibold"
                              style={{ background: 'var(--ss-gold)', color: 'var(--ss-dark)', border: 'none', whiteSpace: 'nowrap' }}
                              onClick={() => handlePagar(r)}
                            >
                              <i className="bi bi-credit-card-fill me-1" />
                              Pagar
                            </button>
                          )}
                          {(r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              disabled={canceling === r.id}
                              onClick={() => setModalId(r.id)}
                            >
                              {canceling === r.id
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="bi bi-x-circle" />
                              }
                            </button>
                          )}
                        </div>
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
