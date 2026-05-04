import { useState, useEffect } from 'react';
import { getReservas, cambiarEstadoReserva } from '../../services/reservasService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage   from '../../components/common/AlertMessage';
import ModalReserva   from '../../components/recepcion/ModalReserva';

const ESTADO_BADGE = {
  PENDIENTE:  'bg-warning text-dark',
  CONFIRMADA: 'bg-success',
  ACTIVA:     'bg-primary',
  CANCELADA:  'bg-secondary',
  FINALIZADA: 'bg-dark',
};

const TRANSICIONES = {
  PENDIENTE:  ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['ACTIVA', 'CANCELADA'],
  ACTIVA:     ['FINALIZADA'],
};

export default function ReservasRecepcion() {
  const [reservas,    setReservas]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [updating,    setUpdating]    = useState(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [busqueda,    setBusqueda]    = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getReservas();
      setReservas(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      setError('Error al cargar reservas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleCambiarEstado = async (id, estado) => {
    setUpdating(id + estado);
    try {
      await cambiarEstadoReserva(id, { estado });
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
    } catch {
      setError('No se pudo actualizar el estado.');
    } finally {
      setUpdating(null);
    }
  };

  const filtradas = reservas.filter(r => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      String(r.id).includes(q) ||
      r.nombreContacto?.toLowerCase().includes(q) ||
      String(r.habitacionNumero ?? r.habitacionId).includes(q)
    );
  });

  return (
    <div className="fade-in-up p-3 p-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--ss-dark)' }}>
            <i className="bi bi-calendar-check me-2" style={{ color: 'var(--ss-gold)' }} />
            Reservas
          </h2>
          <small className="text-muted">Gestión de reservas del hotel</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={cargar}>
            <i className="bi bi-arrow-clockwise" />
          </button>
          <button className="btn btn-ss-dark" onClick={() => setModalOpen(true)}>
            <i className="bi bi-calendar-plus me-2" />Nueva reserva
          </button>
        </div>
      </div>

      <AlertMessage message={error} onClose={() => setError('')} />

      {/* Search */}
      <div className="mb-3" style={{ maxWidth: 340 }}>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-search" /></span>
          <input
            className="form-control"
            placeholder="Buscar por ID, contacto o habitación..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {loading
        ? <LoadingSpinner message="Cargando reservas..." />
        : filtradas.length === 0
          ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-2" />
              No se encontraron reservas.
            </div>
          )
          : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Contacto</th>
                    <th>Habitación</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Huésp.</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(r => {
                    const next = TRANSICIONES[r.estado] ?? [];
                    return (
                      <tr key={r.id}>
                        <td className="text-muted small">#{r.id}</td>
                        <td>{r.nombreContacto ?? '—'}</td>
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
                          <div className="d-flex gap-1 flex-wrap">
                            {next.map(estado => (
                              <button
                                key={estado}
                                className={`btn btn-sm ${estado === 'CANCELADA' ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                                style={{ fontSize: '0.72rem' }}
                                disabled={updating === r.id + estado}
                                onClick={() => handleCambiarEstado(r.id, estado)}
                              >
                                {updating === r.id + estado
                                  ? <span className="spinner-border spinner-border-sm" />
                                  : estado
                                }
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
      }

      <ModalReserva
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={cargar}
      />
    </div>
  );
}
