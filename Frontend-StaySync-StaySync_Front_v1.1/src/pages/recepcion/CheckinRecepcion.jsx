import { useState, useEffect } from 'react';
import { getReservas, cambiarEstadoReserva } from '../../services/reservasService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage   from '../../components/common/AlertMessage';

const HOY = new Date().toISOString().split('T')[0];

export default function CheckinRecepcion() {
  const [reservas,  setReservas]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [updating,  setUpdating]  = useState(null);
  const [tab,       setTab]       = useState('checkin');

  useEffect(() => {
    getReservas()
      .then(data => setReservas(Array.isArray(data) ? data : data.content ?? []))
      .catch(() => setError('Error al cargar reservas.'))
      .finally(() => setLoading(false));
  }, []);

  const pendientesCheckin  = reservas.filter(r => r.estado === 'CONFIRMADA' && r.fechaEntrada === HOY);
  const pendientesCheckout = reservas.filter(r => r.estado === 'ACTIVA');

  const ejecutar = async (id, nuevoEstado, accion) => {
    setUpdating(id); setError('');
    try {
      await cambiarEstadoReserva(id, { estado: nuevoEstado });
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r));
      setSuccess(`${accion} realizado correctamente para la reserva #${id}.`);
    } catch {
      setError(`No se pudo realizar el ${accion.toLowerCase()}.`);
    } finally {
      setUpdating(null);
    }
  };

  const TablaReservas = ({ lista, accion, nuevoEstado, btnClass = 'btn-ss-dark', btnIcon = 'bi-box-arrow-in-right' }) => (
    lista.length === 0
      ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-calendar-check fs-1 d-block mb-2" />
          No hay reservas pendientes de {accion.toLowerCase()} en este momento.
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map(r => (
                <tr key={r.id}>
                  <td className="text-muted small">#{r.id}</td>
                  <td className="fw-medium">{r.nombreContacto ?? '—'}</td>
                  <td>Hab. {r.habitacionNumero ?? r.habitacionId}</td>
                  <td>{r.fechaEntrada ? new Date(r.fechaEntrada).toLocaleDateString('es-CO') : '—'}</td>
                  <td>{r.fechaSalida  ? new Date(r.fechaSalida).toLocaleDateString('es-CO')  : '—'}</td>
                  <td>{r.numHuespedes ?? '—'}</td>
                  <td>
                    <button
                      className={`btn ${btnClass} btn-sm`}
                      disabled={updating === r.id}
                      onClick={() => ejecutar(r.id, nuevoEstado, accion)}
                    >
                      {updating === r.id
                        ? <span className="spinner-border spinner-border-sm" />
                        : <><i className={`bi ${btnIcon} me-1`} />{accion}</>
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  );

  return (
    <div className="fade-in-up p-3 p-md-4">
      <h2 className="fw-bold mb-1" style={{ color: 'var(--ss-dark)' }}>
        <i className="bi bi-door-open me-2" style={{ color: 'var(--ss-gold)' }} />
        Check-in / Check-out
      </h2>
      <p className="text-muted mb-4">
        Check-ins de hoy: <strong>{pendientesCheckin.length}</strong> &nbsp;·&nbsp;
        Check-outs pendientes: <strong>{pendientesCheckout.length}</strong>
      </p>

      <AlertMessage message={error}   onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <ul className="nav nav-pills mb-4 border-bottom pb-3">
        {[['checkin', `Check-in (${pendientesCheckin.length})`], ['checkout', `Check-out (${pendientesCheckout.length})`]].map(([k, l]) => (
          <li key={k} className="nav-item">
            <button
              className={`nav-link fw-semibold ${tab === k ? 'active' : ''}`}
              style={tab === k ? { backgroundColor: 'var(--ss-dark)', color: '#fff' } : { color: 'var(--ss-dark)' }}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          </li>
        ))}
      </ul>

      {loading
        ? <LoadingSpinner message="Cargando reservas..." />
        : tab === 'checkin'
          ? <TablaReservas lista={pendientesCheckin}  accion="Check-in"  nuevoEstado="ACTIVA"    btnIcon="bi-box-arrow-in-right" />
          : <TablaReservas lista={pendientesCheckout} accion="Check-out" nuevoEstado="FINALIZADA" btnClass="btn-outline-primary" btnIcon="bi-box-arrow-right" />
      }
    </div>
  );
}
