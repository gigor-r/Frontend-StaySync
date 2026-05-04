import { useState, useEffect } from 'react';
import { useAuth }       from '../context/AuthContext';
import { getPerfil, updatePerfil } from '../services/usuariosService';
import AlertMessage from '../components/common/AlertMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function PerfilPage() {
  const { user, login } = useAuth();
  const [form,    setForm]    = useState({ nombre: '', apellido: '', telefono: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getPerfil(user.id)
      .then(data => setForm({ nombre: data.nombre ?? '', apellido: data.apellido ?? '', telefono: data.telefono ?? '' }))
      .catch(() => setForm({ nombre: user.nombre ?? '', apellido: user.apellido ?? '', telefono: '' }))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const updated = await updatePerfil(user.id, form);
      login({ ...user, nombre: updated.nombre ?? form.nombre, apellido: updated.apellido ?? form.apellido });
      setSuccess('Perfil actualizado correctamente.');
    } catch {
      setError('No se pudo actualizar el perfil. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando perfil..." />;

  return (
    <div className="fade-in-up p-3 p-md-4">
      <h2 className="fw-bold mb-1" style={{ color: 'var(--ss-dark)' }}>
        <i className="bi bi-person-gear me-2" style={{ color: 'var(--ss-gold)' }} />
        Mi Perfil
      </h2>
      <p className="text-muted mb-4">
        <span className="badge" style={{ background: 'var(--ss-dark)', color: '#fff' }}>{user?.rol}</span>
        {' '}{user?.email}
      </p>

      <div className="card border-0 shadow-sm" style={{ maxWidth: 520 }}>
        <div className="card-body">
          <AlertMessage message={error}   onClose={() => setError('')} />
          <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-medium small">Nombre</label>
                <input
                  className="form-control"
                  value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium small">Apellido</label>
                <input
                  className="form-control"
                  value={form.apellido}
                  onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-medium small">Correo electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  value={user?.email ?? ''}
                  disabled
                />
                <small className="text-muted">El email no puede modificarse.</small>
              </div>
              <div className="col-12">
                <label className="form-label fw-medium small">Teléfono</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+573001234567"
                  value={form.telefono}
                  onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-ss-dark mt-4 px-4" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                : <><i className="bi bi-check-lg me-2" />Guardar cambios</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
