import {
  DataError,
  emptyDatabase,
  mergeDatabase,
  maximumImportBytes,
  parseDatabase,
  previewDatabase,
  validateDatabase,
  type AtaraxiaDatabase,
  type ImportResult,
} from '@ataraxia/shared';
export const databaseKey = 'ataraxia.database';
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function createRepository(storage: () => StorageAdapter) {
  function getRawDatabaseValue() {
    try {
      return storage().getItem(databaseKey);
    } catch {
      throw new DataError(
        'storage',
        'No se puede acceder al almacenamiento del navegador. Revisa sus permisos e inténtalo de nuevo.',
      );
    }
  }
  function saveDatabase(database: AtaraxiaDatabase) {
    const valid = validateDatabase(database);
    const portable = JSON.stringify(
      { ...valid, exportedAt: new Date().toISOString() },
      null,
      2,
    );
    if (new TextEncoder().encode(portable).length > maximumImportBytes)
      throw new DataError(
        'size',
        'Los datos superarían el límite de 2 MB. Exporta una copia y elimina registros que ya no necesites antes de continuar.',
      );
    try {
      storage().setItem(databaseKey, JSON.stringify(valid));
    } catch (error) {
      throw new DataError(
        error instanceof DOMException && error.name === 'QuotaExceededError'
          ? 'quota'
          : 'storage',
        'No se pudieron guardar los cambios. Revisa el espacio y los permisos del navegador; tus datos anteriores se conservan.',
      );
    }
    return valid;
  }
  function getDatabase() {
    const raw = getRawDatabaseValue();
    if (raw === null) return saveDatabase(emptyDatabase());
    if (raw.trim() === '')
      throw new DataError(
        'json',
        'El almacenamiento está vacío o dañado. Descarga el original antes de restablecerlo.',
      );
    return parseDatabase(raw);
  }
  function exportDatabase() {
    const database = getDatabase();
    return JSON.stringify(
      {
        ...database,
        preferences: { ...database.preferences, assessmentDraft: null },
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }
  function importDatabase(
    raw: string,
    mode: 'replace' | 'merge',
    backup?: (raw: string) => void,
  ): ImportResult {
    const incoming = parseDatabase(raw);
    const current = getDatabase();
    if (mode === 'replace') {
      if (!backup)
        throw new Error('A backup callback is required before replacement.');
      backup(exportDatabase());
    }
    const next = mode === 'merge' ? mergeDatabase(current, incoming) : incoming;
    saveDatabase(next);
    return { mode, counts: previewDatabase(next) };
  }
  return {
    getDatabase,
    saveDatabase,
    getRawDatabaseValue,
    exportDatabase,
    importDatabase,
    resetDatabase: () => saveDatabase(emptyDatabase()),
  };
}
export const repository = createRepository(() => window.localStorage);
export function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function backupName() {
  return `ataraxia-backup-${new Date().toISOString().slice(0, 10)}.json`;
}
