import { describe, expect, it } from 'vitest';
import {
  aggregateAssessments,
  emptyDatabase,
  generatePlan,
  mergeDatabase,
  metadata,
  parseDatabase,
  scoreAssessment,
  seedDemoData,
  validateDatabase,
  type AssessmentAnswer,
  type AssessmentRecord,
} from './index';
const answers: AssessmentAnswer = {
  consent: true,
  faculty: 'health',
  semester: 2,
  stress: 0,
  workload: 0,
  worry: 0,
  restlessness: 0,
  symptoms: [],
  urgent: false,
};
function record(overrides: Partial<AssessmentAnswer> = {}): AssessmentRecord {
  const selected = { ...answers, ...overrides };
  return {
    ...metadata(),
    answers: selected,
    result: scoreAssessment(selected),
    source: 'user',
  };
}
describe('demonstration assessment', () => {
  it.each([
    [0, 0, 'low'],
    [3, 2, 'moderate'],
    [3, 7, 'high'],
  ] as const)(
    'determines level for score inputs %s and %s',
    (stress, other, expected) => {
      const result = scoreAssessment({
        ...answers,
        stress,
        workload: Math.min(other, 3),
        worry: Math.min(Math.max(other - 3, 0), 3),
        restlessness: Math.max(other - 6, 0),
      });
      expect(result.level).toBe(expected);
    },
  );
  it('prioritizes urgent support even with a zero score', () => {
    expect(scoreAssessment({ ...answers, urgent: true })).toMatchObject({
      level: 'urgent',
      score: 0,
    });
  });
  it('generates actionable care activities and excludes breathing from urgent plans', () => {
    const plan = generatePlan(record());
    expect(plan.activities.map((activity) => activity.kind)).toEqual([
      'study',
      'breathing',
      'grounding',
      'break',
    ]);
    expect(
      plan.activities.every((activity) => activity.completedAt === null),
    ).toBe(true);
    expect(generatePlan(record({ urgent: true })).activities).toHaveLength(0);
  });
});
describe('database import boundary', () => {
  it('accepts valid and empty databases', () => {
    expect(parseDatabase(JSON.stringify(emptyDatabase()))).toEqual(
      emptyDatabase(),
    );
    const database = { ...emptyDatabase(), assessments: [record()] };
    expect(parseDatabase(JSON.stringify(database))).toEqual(database);
  });
  it('rejects invalid JSON', () => {
    expect(() => parseDatabase('{broken')).toThrow('JSON');
  });
  it('rejects invalid schema and unknown fields', () => {
    expect(() => validateDatabase({ schemaVersion: 1 })).toThrow('estructura');
    expect(() =>
      validateDatabase({
        ...emptyDatabase(),
        html: '<script>execute()</script>',
      }),
    ).toThrow('estructura');
  });
  it('rejects unsupported versions without migration or reset', () => {
    expect(() =>
      validateDatabase({ ...emptyDatabase(), schemaVersion: 2 }),
    ).toThrow('versión');
  });
  it.each(['__proto__', 'prototype', 'constructor'])(
    'rejects dangerous nested key %s',
    (key) => {
      expect(() =>
        parseDatabase(`{"schemaVersion":1,"nested":{"${key}":{}}}`),
      ).toThrow('claves');
    },
  );
  it('deduplicates and preserves the newest valid updatedAt', () => {
    const older = { ...record(), updatedAt: '2026-01-01T00:00:00.000Z' };
    const newer = {
      ...older,
      updatedAt: '2026-02-01T00:00:00.000Z',
      answers: { ...older.answers, semester: 3 },
    };
    const local = { ...emptyDatabase(), assessments: [older] };
    const incoming = { ...emptyDatabase(), assessments: [newer, newer] };
    expect(mergeDatabase(local, incoming).assessments).toEqual([newer]);
    expect(mergeDatabase(incoming, local).assessments).toEqual([newer]);
    expect(validateDatabase(incoming).assessments).toHaveLength(1);
  });
  it('keeps the local record on a timestamp tie', () => {
    const local = record();
    const incoming = { ...local, answers: { ...local.answers, semester: 4 } };
    expect(
      mergeDatabase(
        { ...emptyDatabase(), assessments: [local] },
        { ...emptyDatabase(), assessments: [incoming] },
      ).assessments[0],
    ).toEqual(local);
  });
  it('rejects invalid timestamps', () => {
    expect(() =>
      validateDatabase({
        ...emptyDatabase(),
        assessments: [{ ...record(), updatedAt: 'yesterday' }],
      }),
    ).toThrow();
  });
});
describe('dashboard privacy and demo data', () => {
  it('labels seed data, filters it and does not duplicate seeds', () => {
    const seeded = seedDemoData(emptyDatabase());
    expect(seedDemoData(seeded).assessments).toHaveLength(12);
    expect(aggregateAssessments(seeded.assessments).demo).toBe(12);
    expect(
      aggregateAssessments(seeded.assessments, { source: 'user' }).total,
    ).toBe(0);
  });
  it('derives live totals and returns only safe record summaries', () => {
    const database = seedDemoData({
      ...emptyDatabase(),
      assessments: [record()],
    });
    const aggregate = aggregateAssessments(database.assessments, {
      source: 'user',
    });
    expect(aggregate.total).toBe(1);
    expect(Object.keys(aggregate.recent[0]).sort()).toEqual([
      'date',
      'faculty',
      'level',
      'source',
    ]);
    expect(
      aggregateAssessments(database.assessments, { from: '2999-01-01' }).total,
    ).toBe(0);
  });
});
