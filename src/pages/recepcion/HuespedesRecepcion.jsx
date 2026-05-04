import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage   from '../../components/common/AlertMessage';

export default function HuespedesRecepcion() {
  const [huespedes, setHuespedes] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [busqueda,  setBusqueda]  = useState('');

  useEffect(() => {
    apiClient.get('/usuarios')
      .then(r => setHuespedes(Array.isArray(r.data) ? r.data : r.data.content ?? []))
      .catch(() => setError('Error al cargar la lista de huéspedes.'))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = huespedes.filter(h => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      h.nombre?.toLowerCase().includes(q) ||
      h.apellido?.toLowerCase().includes(q) ||
      h.email?.toLowerCase().includes(q) ||
      h.telefono?.includes(q)
    );
  });

  return (
    <div className="fade-in-up p-3 p-md-4">
      <h2 className="fw-bold mb-1" style={{ color: 'var(--ss-dark)' }}>
        <i className="bi bi-people me-2" style={{ color: 'var(--ss-gold)' }} />
        Huéspedes
      </h2>
      <p className="text-muted mb-4">Directorio de huéspedes registrados</p>

      <AlertMessage message={error} onClose={() => setError('')} />

      <div className="mb-3" style={{ maxWidth: 340 }}>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-search" /></span>
          <input
            className="form-control"
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {loading
        ? <LoadingSpinner message="Cargando huéspedes..." />
        : filtrados.length === 0
          ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x fs-1 d-block mb-2" />
              No se encontraron huéspedes.
            </div>
          )
          : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(h => (
                    <tr key={h.id}>
                      <td className="fw-medium">{h.nombre} {h.apellido}</td>
                      <td className="text-muted">{h.email}</td>
                      <td className="text-muted">{h.telefono ?? '—'}</td>
                      <td>
                        <span className={`badge ${h.activo !== false ? 'bg-success' : 'bg-secondary'}`}>
                          {h.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
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
