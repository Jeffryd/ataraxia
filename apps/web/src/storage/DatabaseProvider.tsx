import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AtaraxiaDatabase } from '@ataraxia/shared';
import { repository, downloadText, backupName } from './repository';
import { SupportPanel } from '../features/emergency-support/SupportPanel';
interface DatabaseContextValue {
  database: AtaraxiaDatabase;
  update: (
    transform: (current: AtaraxiaDatabase) => AtaraxiaDatabase,
  ) => boolean;
  reload: () => void;
  notice: string;
  setNotice: (message: string) => void;
}
const DatabaseContext = createContext<DatabaseContextValue | null>(null);
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    database: AtaraxiaDatabase | null;
    error: string;
  }>(() => {
    try {
      return { database: repository.getDatabase(), error: '' };
    } catch (error) {
      return {
        database: null,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos.',
      };
    }
  });
  const [notice, setNotice] = useState('');
  function reload() {
    try {
      setState({ database: repository.getDatabase(), error: '' });
    } catch (error) {
      setState({
        database: null,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos.',
      });
    }
  }
  function update(transform: (current: AtaraxiaDatabase) => AtaraxiaDatabase) {
    try {
      const database = repository.saveDatabase(
        transform(repository.getDatabase()),
      );
      setState({ database, error: '' });
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los datos.',
      );
      return false;
    }
  }
  if (!state.database)
    return (
      <main className="recovery">
        <h1>Protejamos tus datos locales</h1>
        <p role="alert">{state.error}</p>
        <p>
          No se han descartado tus datos. Puedes descargar el original para
          conservarlo y volver a intentar.
        </p>
        <div className="actions">
          <button
            onClick={() => {
              try {
                const raw = repository.getRawDatabaseValue();
                if (raw !== null)
                  downloadText(raw, backupName().replace('backup', 'recovery'));
                else setNotice('No hay un valor guardado para descargar.');
              } catch (error) {
                setNotice(
                  error instanceof Error
                    ? error.message
                    : 'No se pudo descargar.',
                );
              }
            }}
          >
            Descargar original
          </button>
          <button onClick={reload}>Reintentar</button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  '¿Restablecer todos los datos locales? Esta acción elimina el contenido guardado.',
                )
              ) {
                try {
                  repository.resetDatabase();
                  reload();
                } catch (error) {
                  setNotice(
                    error instanceof Error
                      ? error.message
                      : 'No se pudo restablecer.',
                  );
                }
              }
            }}
          >
            Restablecer datos
          </button>
        </div>
        <p role="status">{notice}</p>
        <SupportPanel urgent />
      </main>
    );
  return (
    <DatabaseContext.Provider
      value={{ database: state.database, update, reload, notice, setNotice }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}
export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('DatabaseProvider is required.');
  return context;
}
