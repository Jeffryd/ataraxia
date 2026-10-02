import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDatabase, metadata, seedDemoData } from '@ataraxia/shared';
import { createRepository, databaseKey } from './repository';
describe('local repository', () => {
  beforeEach(() => localStorage.clear());
  const repo = createRepository(() => localStorage);
  it('initializes one versioned document', () => {
    expect(repo.getDatabase()).toEqual(emptyDatabase());
    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe(databaseKey);
  });
  it.each(['', '{bad', '{"schemaVersion":8}'])(
    'preserves invalid existing storage: %s',
    (raw) => {
      localStorage.setItem(databaseKey, raw);
      expect(() => repo.getDatabase()).toThrow();
      expect(repo.getRawDatabaseValue()).toBe(raw);
    },
  );
  it('handles storage denial', () => {
    const denied = createRepository(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    expect(() => denied.getDatabase()).toThrow('almacenamiento');
  });
  it('does not replace existing records when quota is exhausted', () => {
    let value = JSON.stringify(emptyDatabase());
    const limited = createRepository(() => ({
      getItem: () => value,
      setItem: (_key, next) => {
        if (next.length > value.length)
          throw new DOMException('Full', 'QuotaExceededError');
        value = next;
      },
    }));
    expect(() => limited.saveDatabase(seedDemoData(emptyDatabase()))).toThrow(
      'espacio',
    );
    expect(JSON.parse(value)).toEqual(emptyDatabase());
  });
  it('exports valid dated JSON and excludes the draft', () => {
    repo.saveDatabase({
      ...emptyDatabase(),
      preferences: {
        role: 'student',
        assessmentDraft: { step: 0, consent: true },
      },
    });
    const exported = JSON.parse(repo.exportDatabase());
    expect(exported.schemaVersion).toBe(1);
    expect(exported.exportedAt).toBeTruthy();
    expect(exported.preferences.assessmentDraft).toBeNull();
  });
  it('backs up the original database before replace', () => {
    repo.saveDatabase(seedDemoData(emptyDatabase()));
    const order: string[] = [];
    const storage = {
      getItem: () => localStorage.getItem(databaseKey),
      setItem: (key: string, value: string) => {
        order.push('write');
        localStorage.setItem(key, value);
      },
    };
    const replacing = createRepository(() => storage);
    const backup = vi.fn((raw: string) => {
      order.push('backup');
      expect(JSON.parse(raw).assessments).toHaveLength(12);
    });
    replacing.importDatabase(
      JSON.stringify(emptyDatabase()),
      'replace',
      backup,
    );
    expect(order).toEqual(['backup', 'write']);
    expect(repo.getDatabase().assessments).toHaveLength(0);
  });
  it('requires backup and stops replacement if backup fails', () => {
    repo.getDatabase();
    expect(() =>
      repo.importDatabase(
        JSON.stringify(seedDemoData(emptyDatabase())),
        'replace',
      ),
    ).toThrow('backup');
    expect(() =>
      repo.importDatabase(
        JSON.stringify(seedDemoData(emptyDatabase())),
        'replace',
        () => {
          throw new Error('Download failed');
        },
      ),
    ).toThrow();
    expect(repo.getDatabase().assessments).toHaveLength(0);
  });
  it('does not mutate storage for invalid imports', () => {
    repo.getDatabase();
    const original = repo.getRawDatabaseValue();
    expect(() => repo.importDatabase('{bad', 'merge')).toThrow();
    expect(repo.getRawDatabaseValue()).toBe(original);
  });
  it('merges appointments with latest-update resolution', () => {
    const record = {
      ...metadata(),
      modality: 'virtual' as const,
      preferredDate: '2027-01-01',
      preferredTime: '10:00',
      reason: 'General support',
      notes: '',
      status: 'requested' as const,
      updatedAt: '2026-01-01T00:00:00Z',
    };
    repo.saveDatabase({ ...emptyDatabase(), appointments: [record] });
    repo.importDatabase(
      JSON.stringify({
        ...emptyDatabase(),
        appointments: [
          { ...record, status: 'cancelled', updatedAt: '2026-02-01T00:00:00Z' },
        ],
      }),
      'merge',
    );
    expect(repo.getDatabase().appointments).toHaveLength(1);
    expect(repo.getDatabase().appointments[0].status).toBe('cancelled');
  });
});
