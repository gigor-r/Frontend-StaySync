import { useState, useEffect, useCallback } from 'react';
import { getSolicitudes, actualizarSolicitud } from '../../services/serviciosService';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage   from '../common/AlertMessage';

const ESTADO_META = {
  PENDIENTE:    { label: 'Pendiente',     badge: 'bg-warning text-dark', icon: 'bi-clock',          next: ['EN_PROGRESO'] },
  EN_PROGRESO:  { label: 'En progreso',   badge: 'bg-primary',           icon: 'bi-arrow-repeat',   next: ['TERMINADA', 'PENDIENTE'] },
  TERMINADA:    { label: 'Terminada',     badge: 'bg-success',           icon: 'bi-check-circle',   next: [] },
  CANCELADA:    { label: 'Cancelada',     badge: 'bg-secondary',         icon: 'bi-x-circle',       next: [] },
};

const TIPO_ICONS = {
  LIMPIEZA:     'bi-brush',
  MANTENIMIENTO:'bi-tools',
  LAVANDERIA:   'bi-droplet',
  AMENITIES:    'bi-gift',
};

function TareaCard({ tarea, onActualizar, updating }) {
  const meta = ESTADO_META[tarea.estado] ?? { label: tarea.estado, badge: 'bg-secondary', icon: 'bi-question', next: [] };
  const tipoIcon = TIPO_ICONS[tarea.tipoServicio] ?? 'bi-clipboard-check';
  const cssCls = tarea.estado?.toLowerCase().replace('_', '_');

  return (
    <div className={`tarea-card ${cssCls} mb-3`}>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <i className={`bi ${tipoIcon} fs-5`} style={{ color: 'var(--ss-gold)' }} />
          <div>
            <div className="fw-semibold">{tarea.descripcion ?? tarea.tipoServicio}</div>
            <small className="text-muted">
              Hab. {tarea.habitacionNumero ?? tarea.habitacionId}
              {tarea.huespedNombre && <> · {tarea.huespedNombre}</>}
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className={`badge ${meta.badge}`}>
            <i className={`bi ${meta.icon} me-1`} />{meta.label}
          </span>
          {tarea.prioridad === 'ALTA' && (
            <span className="badge bg-danger">
              <i className="bi bi-exclamation-triangle me-1" />Alta prioridad
            </span>
          )}
        </div>
      </div>

      {tarea.observaciones && (
        <p className="text-muted small mt-2 mb-0">
          <i className="bi bi-chat-left-text me-1" />{tarea.observaciones}
        </p>
      )}

      {meta.next.length > 0 && (
        <div className="d-flex gap-2 mt-3 flex-wrap">
          {meta.next.map(estado => {
            const m = ESTADO_META[estado];
            return (
              <button
                key={estado}
                className={`btn btn-sm ${estado === 'TERMINADA' ? 'btn-ss-dark' : 'btn-outline-secondary'}`}
                disabled={updating === tarea.id}
                onClick={() => onActualizar(tarea.id, estado)}
              >
                {updating === tarea.id
                  ? <span className="spinner-border spinner-border-sm" />
                  : <><i className={`bi ${m.icon} me-1`} />{m.label}</>
                }
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardOperaciones() {
  const [tareas,   setTareas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [updating, setUpdating] = useState(null);
  const [filtro,   setFiltro]   = useState('TODOS');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSolicitudes();
      setTareas(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      setError('Error al cargar las tareas de operaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleActualizar = async (id, nuevoEstado) => {
    setUpdating(id);
    try {
      await actualizarSolicitud(id, { estado: nuevoEstado });
      setTareas(prev =>
        prev.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t)
      );
    } catch {
      setError('No se pudo actualizar la tarea.');
    } finally {
      setUpdating(null);
    }
  };

  const conteo = Object.fromEntries(
    Object.keys(ESTADO_META).map(e => [e, tareas.filter(t => t.estado === e).length])
  );

  const tareasFiltradas = filtro === 'TODOS'
    ? tareas
    : tareas.filter(t => t.estado === filtro);

  const pendientesAlta = tareas.filter(t => t.estado === 'PENDIENTE' && t.prioridad === 'ALTA').length;

  return (
    <div className="fade-in-up p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--ss-dark)' }}>
            <i className="bi bi-clipboard-check me-2" style={{ color: 'var(--ss-gold)' }} />
            Operaciones
          </h2>
          <small className="text-muted">Tareas de limpieza y servicios</small>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={cargar} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1" />Actualizar
        </button>
      </div>

      {/* Alert alta prioridad */}
      {pendientesAlta > 0 && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
          <span>
            <strong>{pendientesAlta}</strong> tarea{pendientesAlta > 1 ? 's' : ''} pendiente{pendientesAlta > 1 ? 's' : ''} de alta prioridad requieren atención.
          </span>
        </div>
      )}

      <AlertMessage message={error} onClose={() => setError('')} />

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        {[
          { estado: 'PENDIENTE',   color: '#efc143', icon: 'bi-clock-fill' },
          { estado: 'EN_PROGRESO', color: '#0d6efd', icon: 'bi-arrow-repeat' },
          { estado: 'TERMINADA',   color: '#198754', icon: 'bi-check-circle-fill' },
        ].map(({ estado, color, icon }) => (
          <div key={estado} className="col-sm-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3">
                <i className={`bi ${icon} fs-3`} style={{ color }} />
                <div>
                  <div className="fw-bold fs-4 lh-1">{conteo[estado] ?? 0}</div>
                  <small className="text-muted">{ESTADO_META[estado].label}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {['TODOS', ...Object.keys(ESTADO_META)].map(e => (
          <button
            key={e}
            className={`btn btn-sm ${filtro === e ? 'btn-ss-dark' : 'btn-outline-secondary'}`}
            onClick={() => setFiltro(e)}
          >
            {e === 'TODOS' ? `Todas (${tareas.length})` : `${ESTADO_META[e].label} (${conteo[e] ?? 0})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading
        ? <LoadingSpinner message="Cargando tareas..." />
        : tareasFiltradas.length === 0
          ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-clipboard-x fs-1 d-block mb-2" />
              {filtro === 'TODOS' ? 'No hay tareas registradas.' : `No hay tareas en estado "${ESTADO_META[filtro]?.label ?? filtro}".`}
            </div>
          )
          : tareasFiltradas.map(t => (
              <TareaCard
                key={t.id}
                tarea={t}
                onActualizar={handleActualizar}
                updating={updating}
              />
            ))
      }
    </div>
  );
}
