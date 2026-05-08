import { useState, useEffect, useCallback } from 'react';
import { getHabitaciones, cambiarEstado } from '../../services/habitacionesService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage   from '../../components/common/AlertMessage';

const ESTADO_META = {
  DISPONIBLE:    { label: 'Disponible',      badge: 'bg-success',          icon: 'bi-check-circle'  },
  OCUPADA:       { label: 'Ocupada',         badge: 'bg-danger',           icon: 'bi-person-fill'   },
  EN_LIMPIEZA:   { label: 'En limpieza',     badge: 'bg-warning text-dark', icon: 'bi-brush'        },
  MANTENIMIENTO: { label: 'Mantenimiento',   badge: 'bg-secondary',        icon: 'bi-tools'         },
  FUERA_SERVICIO:{ label: 'Fuera de servicio', badge: 'bg-dark',           icon: 'bi-x-octagon'    },
};

const TRANSICIONES = {
  DISPONIBLE:    ['EN_LIMPIEZA', 'MANTENIMIENTO'],
  OCUPADA:       ['DISPONIBLE', 'EN_LIMPIEZA'],
  EN_LIMPIEZA:   ['DISPONIBLE', 'MANTENIMIENTO'],
  MANTENIMIENTO: ['DISPONIBLE', 'FUERA_SERVICIO'],
  FUERA_SERVICIO:['DISPONIBLE', 'MANTENIMIENTO'],
};

function HabitacionCard({ hab, onCambiar, updating }) {
  const meta = ESTADO_META[hab.estado] ?? { label: hab.estado, badge: 'bg-secondary', icon: 'bi-question' };
  const next  = TRANSICIONES[hab.estado] ?? [];

  return (
    <div className="col-sm-6 col-lg-4 col-xl-3">
      <div className={`hab-card ${hab.estado.toLowerCase()} h-100`}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="fw-bold fs-5">Hab. {hab.numero}</span>
          <span className={`badge ${meta.badge} small`}>
            <i className={`bi ${meta.icon} me-1`} />{meta.label}
          </span>
        </div>

        <div className="text-muted small mb-1">
          <i className="bi bi-tag me-1" />{hab.tipo}
        </div>
        <div className="text-muted small mb-1">
          <i className="bi bi-people me-1" />Cap. {hab.capacidad}
        </div>
        <div className="text-muted small mb-3">
          <i className="bi bi-currency-dollar me-1" />${hab.precioPorNoche?.toLocaleString()}/noche
        </div>

        {next.length > 0 && (
          <div className="d-flex flex-wrap gap-1">
            {next.map(estado => (
              <button
                key={estado}
                className="btn btn-outline-secondary btn-sm py-0 px-2"
                style={{ fontSize: '0.72rem' }}
                disabled={updating === hab.id}
                onClick={() => onCambiar(hab.id, estado)}
              >
                {updating === hab.id
                  ? <span className="spinner-border spinner-border-sm" />
                  : `→ ${ESTADO_META[estado]?.label ?? estado}`
                }
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HabitacionesRecepcion() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [updating,     setUpdating]     = useState(null);
  const [filtro,       setFiltro]       = useState('TODOS');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHabitaciones();
      setHabitaciones(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      setError('Error al cargar habitaciones. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    setUpdating(id);
    try {
      await cambiarEstado(id, { estado: nuevoEstado });
      setHabitaciones(prev =>
        prev.map(h => h.id === id ? { ...h, estado: nuevoEstado } : h)
      );
    } catch {
      setError('No se pudo actualizar el estado de la habitación.');
    } finally {
      setUpdating(null);
    }
  };

  const conteo = Object.fromEntries(
    Object.keys(ESTADO_META).map(e => [e, habitaciones.filter(h => h.estado === e).length])
  );

  const habsFiltradas = filtro === 'TODOS'
    ? habitaciones
    : habitaciones.filter(h => h.estado === filtro);

  return (
    <div className="fade-in-up p-3 p-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--ss-dark)' }}>
            <i className="bi bi-grid-3x3-gap me-2" style={{ color: 'var(--ss-gold)' }} />
            Habitaciones
          </h2>
          <small className="text-muted">Gestión de estados de habitaciones</small>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={cargar} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1" />Actualizar
        </button>
      </div>

      <AlertMessage message={error} onClose={() => setError('')} />

      {/* Resumen rápido */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {Object.entries(ESTADO_META).map(([key, meta]) => (
          <div key={key} className="card border-0 shadow-sm px-3 py-2 d-flex flex-row align-items-center gap-2">
            <span className={`badge ${meta.badge}`}>
              <i className={`bi ${meta.icon}`} />
            </span>
            <span className="small fw-semibold" style={{ color: 'var(--ss-dark)' }}>
              {meta.label}: <strong>{conteo[key] ?? 0}</strong>
            </span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {['TODOS', ...Object.keys(ESTADO_META)].map(e => (
          <button
            key={e}
            className={`btn btn-sm ${filtro === e ? 'btn-ss-dark' : 'btn-outline-secondary'}`}
            onClick={() => setFiltro(e)}
          >
            {e === 'TODOS'
              ? `Todas (${habitaciones.length})`
              : `${ESTADO_META[e].label} (${conteo[e] ?? 0})`
            }
          </button>
        ))}
      </div>

      {loading
        ? <LoadingSpinner message="Cargando habitaciones..." />
        : habsFiltradas.length === 0
          ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2" />
              No hay habitaciones en este estado.
            </div>
          )
          : (
            <div className="row g-3">
              {habsFiltradas.map(h => (
                <HabitacionCard
                  key={h.id}
                  hab={h}
                  onCambiar={handleCambiarEstado}
                  updating={updating}
                />
              ))}
            </div>
          )
      }
    </div>
  );
}
