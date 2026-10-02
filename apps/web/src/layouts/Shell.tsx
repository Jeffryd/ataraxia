import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandLogo, Dialog } from '../components/ui';
import { SupportPanel } from '../features/emergency-support/SupportPanel';
import { useDatabase } from '../storage/DatabaseProvider';
import { usePublicConfig } from '../services/api';
import styles from './Shell.module.css';
const links = [
  ['/', 'Inicio'],
  ['/recursos', 'Recursos'],
  ['/evaluacion', 'Evaluación'],
  ['/mi-plan', 'Mi plan'],
  ['/atencion', 'Atención'],
];
const secondary = [
  ['/signos-vitales', 'Signos vitales'],
  ['/datos', 'Mis datos'],
  ['/institucional', 'Panel institucional'],
  ['/privacidad', 'Privacidad'],
  ['/accesibilidad', 'Accesibilidad'],
  ['/ayuda', 'Ayuda'],
];
export function Shell() {
  const { config } = usePublicConfig();
  const supportPhone = config.emergencyResources.find(
    (resource) => resource.id === 'institution',
  )?.phone;
  const [menu, setMenu] = useState(false);
  const [support, setSupport] = useState(false);
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const menuButton = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const { database, update, notice, setNotice } = useDatabase();
  useEffect(() => {
    const title =
      [...links, ...secondary].find(
        ([path]) => path === location.pathname,
      )?.[1] ?? 'Bienestar universitario';
    document.title = `${title} · ATARAXIA`;
    if (previousPath.current !== location.pathname) {
      const heading = main.current?.querySelector('h1') ?? main.current;
      heading?.setAttribute('tabindex', '-1');
      heading?.focus();
      previousPath.current = location.pathname;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a href="#main" className={styles.skip}>
        Saltar al contenido
      </a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <div>
            <BrandLogo />
            <small className="muted">{config.institutionName}</small>
          </div>
          <nav className={styles.navigation} aria-label="Navegación principal">
            {links.map(([path, label]) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={
                  path === '/evaluacion' ? styles.evaluationLink : undefined
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            ref={menuButton}
            className={`${styles.menuButton} secondary`}
            aria-expanded={menu}
            aria-controls="mobile-navigation"
            onClick={() => setMenu(!menu)}
          >
            Menú {menu ? '−' : '+'}
          </button>
        </div>
        {menu && (
          <nav
            id="mobile-navigation"
            className={styles.mobile}
            aria-label="Navegación móvil"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setMenu(false);
                menuButton.current?.focus();
              }
            }}
          >
            {[...links, ...secondary].map(([path, label]) => (
              <NavLink key={path} to={path} onClick={() => setMenu(false)}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      {notice && (
        <div role="status" className={styles.notice}>
          <span>{notice}</span>
          <button
            className="secondary"
            onClick={() => setNotice('')}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}
      <main id="main" ref={main} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <BrandLogo />
            <p className="muted">
              <small>
                {config.institutionName} · Un espacio para tu bienestar.
              </small>
            </p>
            {supportPhone && (
              <p>
                <a href={`tel:${supportPhone.replace(/[^+\d]/g, '')}`}>
                  Contacto institucional: {supportPhone}
                </a>
              </p>
            )}
            <div className={styles.role}>
              <label htmlFor="role">Vista de demostración</label>
              <select
                id="role"
                value={database.preferences.role}
                onChange={(event) => {
                  const role =
                    event.target.value === 'institutional'
                      ? 'institutional'
                      : 'student';
                  update((current) => ({
                    ...current,
                    preferences: { ...current.preferences, role },
                  }));
                }}
              >
                <option value="student">Estudiante</option>
                <option value="institutional">Institucional</option>
              </select>
            </div>
            <small className="muted">
              Este selector no es autenticación ni autorización.
            </small>
          </div>
          <div>
            <nav
              className={styles.footerLinks}
              aria-label="Información y datos"
            >
              {secondary.map(([path, label]) => (
                <Link key={path} to={path}>
                  {label}
                </Link>
              ))}
            </nav>
            <p className="muted">
              <small>
                Orientación preventiva. No sustituye la atención profesional.
              </small>
            </p>
          </div>
        </div>
      </footer>
      <button className={styles.support} onClick={() => setSupport(true)}>
        ♡ Necesito apoyo
      </button>
      <Dialog
        open={support}
        title="Ayuda y apoyo inmediato"
        onClose={() => setSupport(false)}
      >
        <SupportPanel />
      </Dialog>
    </>
  );
}
