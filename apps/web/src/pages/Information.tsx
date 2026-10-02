import { Link } from 'react-router-dom';
import { Card, EmptyState, PageHeader } from '../components/ui';
import { SupportPanel } from '../features/emergency-support/SupportPanel';
export function Privacy() {
  return (
    <article className="narrow">
      <PageHeader title="Privacidad en este MVP" />
      <Card>
        <h2>Información en tu navegador</h2>
        <p>
          Las evaluaciones, signos vitales, planes y solicitudes permanecen en
          el perfil de navegador actual. No hay transmisión automática a la
          institución ni monitoreo profesional.
        </p>
        <p>
          Otras personas que usen el mismo perfil pueden acceder a los
          registros. Borrar el almacenamiento o usar navegación privada puede
          hacer que los pierdas. Cada navegador tiene una base independiente.
        </p>
        <h2>Copias y traslado de datos</h2>
        <p>
          Los archivos exportados contienen información sensible, incluidas
          notas privadas. No están cifrados: guárdalos en un lugar seguro. Al
          importar puedes combinar registros o reemplazarlos; reemplazar inicia
          primero una descarga de respaldo.
        </p>
        <h2>Límites de la demostración</h2>
        <p>
          El almacenamiento local no está preparado para un despliegue
          institucional con datos sensibles. El selector de vista no es una
          medida de seguridad. El panel resume solo los registros de este
          navegador y no representa anonimización garantizada frente a
          reidentificación en grupos pequeños.
        </p>
        <p>
          La API sirve recursos y configuración públicos. La app no envía tus
          respuestas ni copias importadas a esa API. No se ha establecido
          cumplimiento normativo, cifrado ni revisión de seguridad.
        </p>
        <Link className="button" to="/datos">
          Administrar mis datos
        </Link>
      </Card>
    </article>
  );
}
export function Accessibility() {
  return (
    <article className="narrow">
      <PageHeader title="Accesibilidad" />
      <Card>
        <p>
          ATARAXIA incluye navegación con teclado, foco visible, enlace para
          saltar al contenido, estructura semántica, etiquetas de formulario y
          diseños que se adaptan al tamaño de pantalla.
        </p>
        <p>
          Los cuadros de diálogo permiten salir con Escape y devuelven el foco
          al control que los abrió. El menú móvil se puede abrir con teclado y
          cerrar con Escape.
        </p>
        <p>
          Las gráficas incluyen resúmenes de texto. Los estados no dependen
          únicamente del color y se respeta la preferencia de reducir el
          movimiento.
        </p>
        <p>
          No contamos con una certificación formal de accesibilidad. Una
          revisión con personas usuarias y tecnologías de apoyo sigue siendo
          necesaria antes de un uso institucional.
        </p>
        <Link to="/ayuda">Consultar ayuda</Link>
      </Card>
    </article>
  );
}
export function Help() {
  return (
    <article className="narrow">
      <PageHeader title="Estamos para orientarte">
        <p>Conoce cómo funciona este espacio de demostración.</p>
      </PageHeader>
      <div className="stack">
        <Card>
          <h2>¿Por dónde empiezo?</h2>
          <p>
            Abre la evaluación, revisa el consentimiento y responde cada paso.
            Puedes retroceder o guardar y salir. Al finalizar recibirás una
            orientación demostrativa y, si corresponde, podrás crear un plan.
          </p>
          <Link to="/evaluacion">Ir a la evaluación →</Link>
          <h2 style={{ marginTop: 28 }}>¿Dónde están mis registros?</h2>
          <p>
            Solo en este navegador. Para trasladarlos, exporta un archivo desde
            Mis datos e impórtalo en el otro navegador. Revisa la vista previa y
            elige combinar o reemplazar.
          </p>
          <Link to="/datos">Abrir Mis datos →</Link>
          <h2 style={{ marginTop: 28 }}>¿Cómo pido atención?</h2>
          <p>
            Elige modalidad, fecha, hora y motivo en Atención. Guardar o
            confirmar una solicitud solo modifica una simulación local: no
            reserva una cita ni avisa a una institución. Para atención real, usa
            los canales oficiales.
          </p>
          <Link to="/atencion">Explorar la simulación →</Link>
        </Card>
        <Card>
          <SupportPanel />
        </Card>
      </div>
    </article>
  );
}
export function NotFound() {
  return (
    <EmptyState
      title="Este camino no está disponible"
      to="/"
      label="Volver al inicio"
    >
      La dirección no corresponde a una página de ATARAXIA. Puedes regresar al
      inicio y elegir tu siguiente paso.
    </EmptyState>
  );
}
