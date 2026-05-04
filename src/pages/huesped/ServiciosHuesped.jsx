import { useState, useEffect } from 'react';
import { getServicios, solicitarServicio, getSolicitudes } from '../../services/serviciosService';
import { useAuth }        from '../../context/AuthContext';
import LoadingSpinner     from '../../components/common/LoadingSpinner';
import AlertMessage       from '../../components/common/AlertMessage';

const ESTADO_BADGE = {
  PENDIENTE:    'bg-warning text-dark',
  EN_PROGRESO:  'bg-primary',
  TERMINADA:    'bg-success',
  CANCELADA:    'bg-secondary',
};

export default function ServiciosHuesped() {
  const { user }  = useAuth();
  const [servicios,   setServicios]   = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [reservaId,   setReservaId]   = useState('');
  const [solicitando, setSolicitando] = useState(null);
  const [tab,         setTab]         = useState('solicitar');

  useEffect(() => {
    Promise.allSettled([getServicios(), getSolicitudes()])
      .then(([svcs, sols]) => {
        if (svcs.status === 'fulfilled') setServicios(Array.isArray(svcs.value) ? svcs.value : []);
        if (sols.status === 'fulfilled') {
          const data = sols.value;
          setSolicitudes(Array.isArray(data) ? data : data.content ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSolicitar = async (servicio) => {
    if (!reservaId) {
      setError('Ingresa el ID de tu reserva activa antes de solicitar un servicio.');
      return;
    }
    setSolicitando(servicio.id); setError('');
    try {
      await solicitarServicio({
        reservaId:    Number(reservaId),
        servicioId:   servicio.id,
        tipoServicio: servicio.tipo ?? servicio.nombre,
        descripcion:  servicio.nombre,
        usuarioId:    user?.id,
      });
      setSuccess(`Servicio "${servicio.nombre}" solicitado correctamente. El equipo lo atenderá pronto.`);
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo solicitar el servicio. Intente nuevamente.');
    } finally {
      setSolicitando(null);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando servicios..." />;

  return (
    <div className="fade-in-up p-3 p-md-4">
      <h2 className="fw-bold mb-1" style={{ color: 'var(--ss-dark)' }}>
        <i className="bi bi-bell me-2" style={{ color: 'var(--ss-gold)' }} />
        Servicios adicionales
      </h2>
      <p className="text-muted mb-4">Solicita servicios desde tu habitación — servicios-service</p>

      <AlertMessage message={error}   onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 border-bottom pb-3">
        {[['solicitar', 'Solicitar servicio'], ['historial', 'Mis solicitudes']].map(([k, l]) => (
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

      {tab === 'solicitar' && (
        <>
          <div className="mb-4" style={{ maxWidth: 320 }}>
            <label className="form-label fw-medium small">ID de tu reserva activa</label>
            <input
              type="number"
              className="form-control"
              placeholder="Ej: 42"
              value={reservaId}
              onChange={e => setReservaId(e.target.value)}
            />
          </div>

          {servicios.length === 0
            ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2" />
                No hay servicios disponibles en este momento.
              </div>
            )
            : (
              <div className="row g-3">
                {servicios.map(s => (
                  <div key={s.id} className="col-sm-6 col-xl-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center gap-3 mb-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 44, height: 44, background: 'rgba(239,193,67,0.15)' }}
                          >
                            <i className="bi bi-box-seam fs-5" style={{ color: 'var(--ss-gold)' }} />
                          </div>
                          <div>
                            <div className="fw-semibold">{s.nombre}</div>
                            {s.precio && (
                              <small className="text-muted">${Number(s.precio).toLocaleString()}</small>
                            )}
                          </div>
                        </div>
                        {s.descripcion && (
                          <p className="text-muted small mb-3">{s.descripcion}</p>
                        )}
                        <button
                          className="btn btn-ss-dark btn-sm w-100"
                          disabled={solicitando === s.id}
                          onClick={() => handleSolicitar(s)}
                        >
                          {solicitando === s.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <><i className="bi bi-bell me-1" />Solicitar</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </>
      )}

      {tab === 'historial' && (
        solicitudes.length === 0
          ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-clipboard-x fs-1 d-block mb-2" />
              No tienes solicitudes de servicios registradas.
            </div>
          )
          : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Servicio</th>
                    <th>Reserva</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map(s => (
                    <tr key={s.id}>
                      <td className="fw-medium">{s.descripcion ?? s.tipoServicio}</td>
                      <td className="text-muted small">#{s.reservaId}</td>
                      <td>
                        <span className={`badge ${ESTADO_BADGE[s.estado] ?? 'bg-secondary'}`}>
                          {s.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}
    </div>
  );
}
