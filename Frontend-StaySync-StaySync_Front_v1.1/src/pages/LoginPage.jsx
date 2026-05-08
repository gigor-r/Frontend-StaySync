import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginService, register as registerSvc } from '../services/authService';
import AlertMessage from '../components/common/AlertMessage';

const REDIRECT = { ADMIN: '/recepcion', RECEPCIONISTA: '/recepcion', HUESPED: '/huesped' };

export default function LoginPage() {
  const [form,        setForm]        = useState({ email: '', password: '' });
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [tab,         setTab]         = useState('login'); // 'login' | 'register'
  const [reg,         setReg]         = useState({ nombre:'', apellido:'', email:'', password:'', telefono:'' });
  const [regErr,      setRegErr]      = useState('');
  const [regOk,       setRegOk]       = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname;

  /* ── Login ──────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await loginService(form.email, form.password);
      login(data);
      navigate(from ?? REDIRECT[data.rol] ?? '/huesped', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Credenciales incorrectas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ───────────────────────────────────────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErr(''); setLoading(true);
    try {
      await registerSvc(reg);
      setRegOk(true);
      setTimeout(() => setTab('login'), 2500);
    } catch (err) {
      setRegErr(err.response?.data?.message ?? 'No se pudo registrar. Intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container row g-0 min-vh-100">
      {/* ── Brand panel ─── */}
      <div className="col-md-5 login-brand-panel d-none d-md-flex fade-in-up">
        <div className="brand-logo mb-4">🏨</div>
        <h1>StaySync</h1>
        <p className="text-center mt-2 px-4">
          Sistema integral de gestión hotelera.<br />
          Optimiza operaciones, maximiza la satisfacción de tus huéspedes.
        </p>

        <div className="mt-5 d-flex flex-column gap-3 w-100" style={{ maxWidth: 280 }}>
          {[
            { icon: 'bi-shield-check',    text: 'Seguridad JWT & RBAC' },
            { icon: 'bi-graph-up-arrow',  text: 'Dashboard en tiempo real' },
            { icon: 'bi-bell',            text: 'Notificaciones automáticas' },
          ].map(({ icon, text }) => (
            <div key={text} className="d-flex align-items-center gap-3">
              <i className={`bi ${icon} fs-5 text-warning`} />
              <span className="text-white-50 small">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form panel ─── */}
      <div className="col-md-7 login-form-panel fade-in-up">
        <div className="login-form-card">
          {/* Mobile logo */}
          <div className="text-center mb-4 d-md-none">
            <span style={{ fontSize: '3rem' }}>🏨</span>
            <h2 className="fw-bold" style={{ color: 'var(--ss-dark)' }}>StaySync</h2>
          </div>

          {/* Tabs */}
          <ul className="nav nav-pills mb-4 border-bottom pb-3">
            {[['login','Iniciar Sesión'],['register','Registrarse']].map(([k,l]) => (
              <li key={k} className="nav-item">
                <button
                  className={`nav-link fw-semibold ${tab===k ? 'active' : ''}`}
                  style={tab===k ? { backgroundColor:'var(--ss-dark)', color:'#fff' } : { color:'var(--ss-dark)' }}
                  onClick={() => setTab(k)}
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>

          {/* ── Login form ── */}
          {tab === 'login' && (
            <>
              <h3 className="fw-bold mb-1">Bienvenido</h3>
              <p className="text-muted small mb-4">Ingresa tus credenciales para continuar</p>
              <AlertMessage message={error} onClose={() => setError('')} />

              <form onSubmit={handleLogin} noValidate>
                <div className="mb-3">
                  <label className="form-label fw-medium small">Correo electrónico</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-envelope" /></span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="usuario@staysync.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium small">Contraseña</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-lock" /></span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="input-group-text bg-white border-start-0"
                      onClick={() => setShowPass(v => !v)}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-ss-dark w-100 py-2 fw-semibold"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Verificando...</>
                    : <><i className="bi bi-box-arrow-in-right me-2" />Ingresar</>
                  }
                </button>
              </form>

              <div className="mt-4 p-3 rounded" style={{ background:'rgba(239,193,67,0.1)', border:'1px solid rgba(239,193,67,0.3)' }}>
                <p className="mb-1 fw-semibold small" style={{ color:'var(--ss-dark)' }}>
                  <i className="bi bi-info-circle me-1" />Credenciales de demo
                </p>
                <small className="text-muted">
                  Admin: admin@staysync.com / Admin@1234<br />
                  Recepción: recep@staysync.com / Recep@1234<br />
                  Huésped: huesped@staysync.com / Huesped@1234
                </small>
              </div>
            </>
          )}

          {/* ── Register form ── */}
          {tab === 'register' && (
            <>
              <h3 className="fw-bold mb-1">Crear cuenta</h3>
              <p className="text-muted small mb-4">Registro de huéspedes</p>

              {regOk
                ? <div className="alert alert-success text-center">
                    <i className="bi bi-check-circle-fill me-2" />
                    ¡Registro exitoso! Redirigiendo al login...
                  </div>
                : <>
                  <AlertMessage message={regErr} onClose={() => setRegErr('')} />
                  <form onSubmit={handleRegister} noValidate>
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-medium small">Nombre</label>
                        <input className="form-control" placeholder="Juan" value={reg.nombre}
                          onChange={e => setReg(p=>({...p,nombre:e.target.value}))} required />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-medium small">Apellido</label>
                        <input className="form-control" placeholder="García" value={reg.apellido}
                          onChange={e => setReg(p=>({...p,apellido:e.target.value}))} required />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-medium small">Correo electrónico</label>
                      <input type="email" className="form-control" placeholder="tu@email.com" value={reg.email}
                        onChange={e => setReg(p=>({...p,email:e.target.value}))} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-medium small">Teléfono (opcional)</label>
                      <input type="tel" className="form-control" placeholder="+573001234567" value={reg.telefono}
                        onChange={e => setReg(p=>({...p,telefono:e.target.value}))} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-medium small">Contraseña</label>
                      <div className="input-group">
                        <input
                          type={showRegPass ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Mínimo 8 chars, mayús, número y símbolo"
                          value={reg.password}
                          onChange={e => setReg(p=>({...p,password:e.target.value}))}
                          required
                        />
                        <button
                          type="button"
                          className="input-group-text bg-white border-start-0"
                          onClick={() => setShowRegPass(v => !v)}
                          tabIndex={-1}
                        >
                          <i className={`bi ${showRegPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                      </div>
                      <small className="text-muted">Ej: MiPass@123</small>
                    </div>
                    <button type="submit" className="btn btn-ss-dark w-100 py-2 fw-semibold" disabled={loading}>
                      {loading
                        ? <><span className="spinner-border spinner-border-sm me-2"/>Registrando...</>
                        : <><i className="bi bi-person-plus me-2"/>Crear cuenta</>
                      }
                    </button>
                  </form>
                </>
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
}
