import { useState } from 'react';
import {
  maximumImportBytes,
  parseDatabase,
  previewDatabase,
  type AtaraxiaDatabase,
} from '@ataraxia/shared';
import { repository, downloadText, backupName } from '../../storage/repository';
import { useDatabase } from '../../storage/DatabaseProvider';
import {
  Alert,
  Card,
  ConfirmDialog,
  Field,
  PageHeader,
} from '../../components/ui';
const countLabels = {
  assessments: 'Evaluaciones',
  vitalSigns: 'Signos vitales',
  plans: 'Planes',
  appointments: 'Solicitudes',
  activityLogs: 'Actividades',
};
export function DataTransfer() {
  const { database, reload, setNotice } = useDatabase();
  const [incoming, setIncoming] = useState<{
    raw: string;
    database: AtaraxiaDatabase;
  } | null>(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<
    'export' | 'replace' | 'merge' | 'reset' | null
  >(null);
  const [busy, setBusy] = useState(false);
  async function readFile(file: File | undefined) {
    setError('');
    setIncoming(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Selecciona un archivo .json.');
      return;
    }
    if (file.size > maximumImportBytes) {
      setError('El archivo supera el límite de 2 MB.');
      return;
    }
    setBusy(true);
    try {
      const raw = await file.text();
      setIncoming({ raw, database: parseDatabase(raw) });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo leer el archivo. Selecciona otra copia.',
      );
    } finally {
      setBusy(false);
    }
  }
  function apply() {
    setError('');
    try {
      if (confirm === 'export') {
        downloadText(repository.exportDatabase(), backupName());
        setNotice(
          'Se solicitó la descarga de tu copia. Comprueba que el archivo se guardó.',
        );
      } else if (confirm === 'reset') {
        repository.resetDatabase();
        reload();
        setIncoming(null);
        setNotice('Datos locales restablecidos.');
      } else if (incoming && (confirm === 'replace' || confirm === 'merge')) {
        repository.importDatabase(incoming.raw, confirm, (raw) =>
          downloadText(
            raw,
            backupName().replace('.json', '-before-replace.json'),
          ),
        );
        reload();
        setIncoming(null);
        setNotice(
          confirm === 'replace'
            ? 'Datos reemplazados. Se solicitó descargar el respaldo anterior.'
            : 'Datos combinados; se conservaron los registros más recientes por identificador.',
        );
      }
      setConfirm(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'No se aplicaron los cambios.',
      );
      setConfirm(null);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Privacidad y portabilidad"
        title="Tus datos, bajo tu control"
      >
        <p>
          Exporta una copia, cambia de navegador o administra los registros de
          este dispositivo.
        </p>
      </PageHeader>
      <Alert>
        Los archivos pueden contener información sensible de bienestar y notas
        privadas. No están cifrados. Guárdalos en un lugar seguro y evita
        compartirlos en dispositivos públicos.
      </Alert>
      <div className="grid">
        <Card>
          <h2>En este navegador</h2>
          <dl>
            {Object.entries(previewDatabase(database)).map(([key, value]) => (
              <div key={key}>
                <dt>{countLabels[key as keyof typeof countLabels]}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            Versión de datos: 1. Los borradores de evaluación no se incluyen al
            exportar.
          </p>
          <button onClick={() => setConfirm('export')}>
            Exportar mis datos
          </button>
        </Card>
        <Card>
          <h2>Importar una copia</h2>
          <p>
            Selecciona un archivo JSON de ATARAXIA de hasta 2 MB. Se valida
            antes de modificar tus registros.
          </p>
          <Field id="import" label="Archivo de respaldo">
            <input
              id="import"
              type="file"
              accept=".json,application/json"
              disabled={busy}
              onChange={(event) => void readFile(event.target.files?.[0])}
            />
          </Field>
          {busy && <p role="status">Validando archivo…</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {incoming && (
            <section aria-label="Vista previa de importación">
              <h3 style={{ marginTop: 24 }}>Vista previa validada</h3>
              <ul>
                {Object.entries(previewDatabase(incoming.database)).map(
                  ([key, value]) => (
                    <li key={key}>
                      {countLabels[key as keyof typeof countLabels]}: {value}
                    </li>
                  ),
                )}
              </ul>
              <p>
                Combinar conserva los registros con la fecha de actualización
                más reciente. En un empate conserva el local. Reemplazar
                descarga primero una copia del estado actual.
              </p>
              <div className="actions">
                <button onClick={() => setConfirm('merge')}>Combinar</button>
                <button
                  className="secondary"
                  onClick={() => setConfirm('replace')}
                >
                  Reemplazar
                </button>
                <button className="secondary" onClick={() => setIncoming(null)}>
                  Descartar archivo
                </button>
              </div>
            </section>
          )}
        </Card>
      </div>
      <Card className="stack">
        <h2>Restablecer este espacio</h2>
        <p>
          Eliminará las evaluaciones, planes, signos vitales, solicitudes y
          preferencias de este navegador. Exporta una copia antes si deseas
          conservarlos.
        </p>
        <div>
          <button className="danger" onClick={() => setConfirm('reset')}>
            Eliminar todos los datos locales
          </button>
        </div>
      </Card>
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === 'export'
            ? '¿Descargar información sensible?'
            : confirm === 'reset'
              ? '¿Eliminar todos los datos?'
              : confirm === 'replace'
                ? '¿Reemplazar los datos locales?'
                : '¿Combinar los registros?'
        }
        onClose={() => setConfirm(null)}
        onConfirm={apply}
      >
        {confirm === 'export'
          ? 'El archivo incluirá tus registros y notas privadas, sin cifrado. Guárdalo de forma segura.'
          : confirm === 'replace'
            ? 'Se iniciará la descarga de un respaldo antes de reemplazar. Permite las descargas y comprueba que el archivo se conserva. Los registros actuales serán sustituidos.'
            : confirm === 'reset'
              ? 'Esta acción no puede deshacerse sin una copia exportada. No se notificará a ninguna institución.'
              : 'Los registros se unirán por identificador y se conservará la actualización más reciente. Las preferencias locales se mantienen.'}
      </ConfirmDialog>
    </>
  );
}
