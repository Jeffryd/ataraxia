import { usePublicConfig } from '../../services/api';
import { Alert } from '../../components/ui';
export function SupportPanel({ urgent = false }: { urgent?: boolean }) {
  const { config, isError, refetch } = usePublicConfig();
  return (
    <section>
      <h2>
        {urgent ? 'Busca apoyo ahora' : 'No tienes que afrontar esto a solas'}
      </h2>
      <p>
        Si estás en peligro inmediato o no puedes mantenerte a salvo, contacta
        los servicios de emergencia de tu localidad. Busca a una persona de
        confianza que pueda acompañarte y a un profesional cualificado.
      </p>
      <Alert urgent={urgent}>
        ATARAXIA no monitorea esta sesión y no ha contactado automáticamente a
        nadie.
      </Alert>
      {(config.fallback || isError) && (
        <p className="muted">
          Configuración local de respaldo. Confirma los contactos vigentes de tu
          localidad e institución.
        </p>
      )}
      <div className="stack">
        {config.emergencyResources.map((resource) => (
          <div key={resource.id}>
            <h3>{resource.label}</h3>
            {resource.phone ? (
              <a
                className="button"
                href={`tel:${resource.phone.replace(/[^+\d]/g, '')}`}
              >
                Llamar al {resource.phone}
              </a>
            ) : (
              <p>
                No hay un teléfono configurado. Consulta el número oficial de
                emergencias o el servicio de bienestar de tu universidad.
              </p>
            )}
            {resource.url && (
              <p>
                <a href={resource.url} target="_blank" rel="noreferrer">
                  Abrir apoyo institucional
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
      {isError && (
        <button className="secondary" onClick={() => void refetch()}>
          Reintentar conexión
        </button>
      )}
    </section>
  );
}
