import { Link } from 'react-router-dom';
import { Card, FeatureCard } from '../components/ui';
import { usePublicConfig } from '../services/api';
import styles from './Home.module.css';
export function Home() {
  const { config } = usePublicConfig();
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className="eyebrow">
            {config.institutionName} · Bienestar universitario
          </p>
          <h1>
            Encuentra tu calma,
            <br />
            cultiva tu paz mental
          </h1>
          <p>
            Entre clases, proyectos y nuevos caminos, también hay espacio para
            ti. Haz una pausa y descubre cómo cuidar tu bienestar.
          </p>
          <div className={`actions ${styles.heroActions}`}>
            <Link className="button" to="/evaluacion">
              Inicia tu evaluación de bienestar{' '}
              <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button secondary" to="/recursos">
              Explora recursos
            </Link>
          </div>
          <small>
            Una orientación para conocerte mejor. No es un diagnóstico.
          </small>
        </div>
      </section>
      <section className={styles.features} aria-label="Tu espacio de bienestar">
        <FeatureCard to="/evaluacion" icon="◎" title="Evaluación de bienestar">
          Revisa cómo te has sentido con un autochequeo a tu ritmo.
        </FeatureCard>
        <FeatureCard to="/recursos" icon="⌁" title="Recursos preventivos">
          Ideas sencillas para tu descanso, tus estudios y tu calma.
        </FeatureCard>
        <FeatureCard to="/mi-plan" icon="☼" title="Mi plan personal">
          Encuentra pequeños pasos de autocuidado para tu día.
        </FeatureCard>
        <FeatureCard to="/atencion" icon="♡" title="Modalidades de atención">
          Explora opciones de apoyo en una solicitud simulada.
        </FeatureCard>
      </section>
      <section className={`${styles.section} ${styles.duo}`}>
        <div>
          <p className="eyebrow">Una mirada integral</p>
          <h2>Tu bienestar va más allá de lo académico.</h2>
          <p className="muted">
            El descanso, las emociones y lo que vives en la universidad están
            conectados. ATARAXIA reúne orientación preventiva desde Enfermería y
            Psicología para mirar el panorama completo.
          </p>
          <Link to="/recursos">Conoce los recursos de autocuidado →</Link>
        </div>
        <div className={styles.quote}>
          <p>
            Un momento para escucharte.
            <br />
            Un espacio para volver a ti.
          </p>
          <div className="actions">
            <span>Enfermería</span>
            <span aria-hidden="true">+</span>
            <span>Psicología</span>
          </div>
          <small>
            Contenido demostrativo pendiente de revisión institucional.
          </small>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">Tu recorrido, tu ritmo</p>
            <h2>Encuentra el siguiente paso que necesitas.</h2>
          </div>
          <p className="muted">
            Puedes volver a cada espacio
            <br />
            cuando lo necesites.
          </p>
        </div>
        <ol className={styles.journey}>
          {[
            ['/', 'Inicio'],
            ['/recursos', 'Información y prevención'],
            ['/evaluacion', 'Evaluación biopsicosocial'],
            ['/mi-plan', 'Plan personal'],
            ['/atencion', 'Modalidad de atención'],
            ['/institucional', 'Control institucional'],
          ].map(([to, label]) => (
            <li key={to}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ol>
      </section>
      <section className={`${styles.section} grid`}>
        <Card>
          <p className="eyebrow">Cómo funciona</p>
          <h2>Una pausa con intención</h2>
          <p>
            Responde preguntas breves, revisa tu orientación y elige acciones de
            autocuidado. Puedes omitir los signos vitales y retomar una
            evaluación guardada.
          </p>
          <Link to="/evaluacion">Comenzar el autochequeo →</Link>
        </Card>
        <Card>
          <p className="eyebrow">Tus datos, cerca de ti</p>
          <h2>Un espacio local</h2>
          <p>
            Los registros permanecen en este navegador. No se envían
            automáticamente a una institución. Puedes exportarlos, importarlos o
            eliminarlos.
          </p>
          <Link to="/privacidad">Entender la privacidad →</Link>
        </Card>
      </section>
      <section className={`${styles.section} ${styles.duo}`}>
        <div>
          <h2>Apoyo cuando lo necesitas</h2>
          <p>
            Si necesitas conversar, busca a una persona de confianza o a un
            profesional. En una emergencia, contacta los servicios de tu
            localidad.
          </p>
          <Link to="/ayuda">Consultar ayuda y contactos →</Link>
        </div>
        <div>
          <h3>Una mirada institucional de demostración</h3>
          <p className="muted">
            El panel resume únicamente los registros de este navegador, sin
            mostrar notas privadas ni datos de contacto.
          </p>
          <Link to="/institucional">Explorar el panel local →</Link>
        </div>
      </section>
      <section className={`${styles.section} ${styles.closing}`}>
        <p className="eyebrow" style={{ color: 'inherit' }}>
          Empieza por un momento para ti
        </p>
        <h2>Tu bienestar merece un espacio.</h2>
        <Link className="button" to="/evaluacion">
          Revisa cómo te has sentido →
        </Link>
      </section>
    </>
  );
}
