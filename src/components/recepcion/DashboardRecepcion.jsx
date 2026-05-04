import { useState, useEffect, useCallback } from 'react';
import { getHabitaciones, cambiarEstado } from '../../services/habitacionesService';
import { getDashboard }                   from '../../services/dashboardService';
import LoadingSpinner                     from '../common/LoadingSpinner';
import AlertMessage                       from '../common/AlertMessage';
import ModalReserva                       from './ModalReserva';

const ESTADO_META = {
  DISPONIBLE:   { label: 'Disponible',   badge: 'bg-success',   icon: 'bi-check-circle'     },
  OCUPADA:      { label: 'Ocupada',      badge: 'bg-danger',    icon: 'bi-person-fill'       },
  EN_LIMPIEZA:  { label: 'En limpieza',  badge: 'bg-warning text-dark', icon: 'bi-brush'    },
  MANTENIMIENTO:{ label: 'Mantenimiento',badge: 'bg-secondary', icon: 'bi-tools'             },
  FUERA_SERVICIO:{ label: 'Fuera servicio',badge:'bg-dark',     icon: 'bi-x-octagon'        },
};

const TRANSICIONES = {
  DISPONIBLE:    ['EN_LIMPIEZA', 'MANTENIMIENTO'],
  OCUPADA:       ['DISPONIBLE', 'EN_LIMPIEZA'],
  EN_LIMPIEZA:   ['DISPONIBLE', 'MANTENIMIENTO'],
  MANTENIMIENTO: ['DISPONIBLE', 'FUERA_SERVICIO'],
  FUERA_SERVICIO:['DISPONIBLE', 'MANTENIMIENTO'],
};

function StatCard({ icon, label, value, color }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 52, height: 52, background: color + '22' }}
          >
            <i className={`bi ${icon} fs-4`} style={{ color }} />
          </div>
          <div>
            <div className="fw-bold fs-4 lh-1">{value ?? '—'}</div>
            <small className="text-muted">{label}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitacionCard({ hab, onCambiar, updating }) {
  const meta = ESTADO_META[hab.estado] ?? { label: hab.estado, badge: 'bg-secondary', icon: 'bi-question' };
  const next  = TRANSICIONES[hab.estado] ?? [];

  return (
    <div className={`col-sm-6 col-lg-4 col-xl-3`}>
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
        <div className="text-muted small mb-3">
          <i className="bi bi-people me-1" />Cap. {hab.capacidad}
          &nbsp;·&nbsp;
          <i className="bi bi-currency-dollar me-1" />{hab.precioPorNoche?.toLocaleString()}/noche
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

export default function DashboardRecepcion() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [updating,     setUpdating]     = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [filtro,       setFiltro]       = useState('TODOS');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [habs, dash] = await Promise.allSettled([
        getHabitaciones(),
        getDashboard(),
      ]);
      if (habs.status === 'fulfilled') setHabitaciones(habs.value);
      if (dash.status === 'fulfilled') setStats(dash.value);
    } catch {
      setError('Error al cargar datos. Intente nuevamente.');
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

  const habsFiltradas = filtro === 'TODOS'
    ? habitaciones
    : habitaciones.filter(h => h.estado === filtro);

  const conteo = Object.fromEntries(
    Object.keys(ESTADO_META).map(e => [e, habitaciones.filter(h => h.estado === e).length])
  );

  return (
    <div className="fade-in-up p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--ss-dark)' }}>
            <i className="bi bi-grid-3x3-gap me-2" style={{ color: 'var(--ss-gold)' }} />
            Dashboard Recepción
          </h2>
          <small className="text-muted">Gestión de habitaciones en tiempo real</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={cargar} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1" />Actualizar
          </button>
          <button
            className="btn btn-ss-dark"
            onClick={() => setModalOpen(true)}
          >
            <i className="bi bi-calendar-plus me-2" />Nueva reserva
          </button>
        </div>
      </div>

      <AlertMessage message={error} onClose={() => setError('')} />

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <StatCard icon="bi-check-circle-fill" label="Disponibles"   value={conteo.DISPONIBLE}    color="#198754" />
        <StatCard icon="bi-person-fill"       label="Ocupadas"      value={conteo.OCUPADA}        color="#dc3545" />
        <StatCard icon="bi-brush"             label="En limpieza"   value={conteo.EN_LIMPIEZA}    color="#efc143" />
        <StatCard icon="bi-tools"             label="Mantenimiento" value={conteo.MANTENIMIENTO}  color="#6c757d" />
      </div>

      {/* Stats from dashboard service */}
      {stats && (
        <div className="row g-3 mb-4">
          {stats.totalReservasHoy !== undefined && (
            <StatCard icon="bi-calendar-check" label="Reservas hoy"   value={stats.totalReservasHoy}   color="#0d6efd" />
          )}
          {stats.checkInsHoy !== undefined && (
            <StatCard icon="bi-box-arrow-in-right" label="Check-ins hoy" value={stats.checkInsHoy}    color="#20c997" />
          )}
          {stats.checkOutsHoy !== undefined && (
            <StatCard icon="bi-box-arrow-right"    label="Check-outs hoy" value={stats.checkOutsHoy}  color="#fd7e14" />
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {['TODOS', ...Object.keys(ESTADO_META)].map(e => (
          <button
            key={e}
            className={`btn btn-sm ${filtro === e ? 'btn-ss-dark' : 'btn-outline-secondary'}`}
            onClick={() => setFiltro(e)}
          >
            {e === 'TODOS' ? `Todas (${habitaciones.length})` : `${ESTADO_META[e].label} (${conteo[e] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Grid */}
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

      <ModalReserva
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={cargar}
      />
    </div>
  );
}
