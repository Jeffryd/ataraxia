import {
  databaseSchema,
  type AtaraxiaDatabase,
  type AssessmentAnswer,
  type AssessmentRecord,
  type AssessmentResult,
  type CarePlanRecord,
  type ImportPreview,
} from './schemas';

export const scoringConfig = Object.freeze({
  moderate: 5,
  high: 10,
  urgentAnswer: 'urgent',
  version: 1 as const,
});
export const levelLabels = {
  low: 'Autocuidado cotidiano',
  moderate: 'Atención preventiva sugerida',
  high: 'Apoyo profesional recomendado',
  urgent: 'Busca apoyo inmediato',
};
export const facultyLabels = {
  health: 'Ciencias de la salud',
  engineering: 'Ingeniería',
  humanities: 'Humanidades',
  business: 'Ciencias económicas',
  other: 'Otra facultad',
};
export const symptomLabels = {
  sleep: 'Dificultad para dormir',
  concentration: 'Falta de concentración',
  palpitations: 'Palpitaciones',
  tension: 'Tensión muscular',
};
export const categoryLabels = {
  body: 'Cuerpo y descanso',
  mind: 'Calma y emociones',
  study: 'Vida académica',
};
export function metadata() {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}
export function emptyDatabase(): AtaraxiaDatabase {
  return {
    schemaVersion: 1,
    profile: null,
    assessments: [],
    vitalSigns: [],
    plans: [],
    appointments: [],
    activityLogs: [],
    preferences: { role: 'student', assessmentDraft: null },
  };
}
export function scoreAssessment(answers: AssessmentAnswer): AssessmentResult {
  const score =
    answers.stress +
    answers.workload +
    answers.worry +
    answers.restlessness +
    new Set(answers.symptoms).size;
  return {
    score,
    level: answers.urgent
      ? 'urgent'
      : score >= scoringConfig.high
        ? 'high'
        : score >= scoringConfig.moderate
          ? 'moderate'
          : 'low',
    ruleVersion: 1,
  };
}
export function generatePlan(assessment: AssessmentRecord): CarePlanRecord {
  const activities: CarePlanRecord['activities'] =
    assessment.result.level === 'urgent'
      ? []
      : [
          {
            ...metadata(),
            title: 'Una prioridad para hoy',
            kind: 'study',
            instructions:
              'Elige una tarea pequeña. Divide el trabajo en pasos y reserva un momento de descanso.',
            completedAt: null,
          },
          {
            ...metadata(),
            title: 'Respiración a tu ritmo',
            kind: 'breathing',
            instructions:
              'Si te resulta cómodo, toma un minuto para respirar de forma natural, sin retener el aire ni forzar el ritmo. Detente si aparece malestar y consulta a un profesional cuando corresponda.',
            completedAt: null,
          },
          {
            ...metadata(),
            title: 'Vuelve al presente',
            kind: 'grounding',
            instructions:
              'Observa tres objetos a tu alrededor y nota el contacto de tus pies con el suelo. Puedes detenerte en cualquier momento.',
            completedAt: null,
          },
          {
            ...metadata(),
            title: 'Una pausa entre tareas',
            kind: 'break',
            instructions:
              'Cambia de postura con suavidad, descansa la vista y camina un poco si puedes hacerlo cómodamente.',
            completedAt: null,
          },
        ];
  return {
    ...metadata(),
    assessmentId: assessment.id,
    level: assessment.result.level,
    activities,
  };
}
export const maximumImportBytes = 2 * 1024 * 1024;
export class DataError extends Error {
  constructor(
    public readonly code:
      | 'json'
      | 'schema'
      | 'version'
      | 'dangerous'
      | 'size'
      | 'storage'
      | 'quota',
    message: string,
  ) {
    super(message);
    this.name = 'DataError';
  }
}
function rejectDangerousKeys(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key))
        throw new DataError(
          'dangerous',
          'El archivo contiene claves no permitidas.',
        );
      rejectDangerousKeys((value as Record<string, unknown>)[key]);
    }
  }
}
export function validateDatabase(value: unknown): AtaraxiaDatabase {
  rejectDangerousKeys(value);
  if (
    value &&
    typeof value === 'object' &&
    'schemaVersion' in value &&
    value.schemaVersion !== 1
  )
    throw new DataError(
      'version',
      'Esta versión de datos no es compatible. Conserva el archivo original.',
    );
  const parsed = databaseSchema.safeParse(value);
  if (!parsed.success)
    throw new DataError(
      'schema',
      'La estructura de los datos no es válida. No se aplicó ningún cambio.',
    );
  for (const assessment of parsed.data.assessments) {
    const expected = scoreAssessment(assessment.answers);
    if (
      expected.score !== assessment.result.score ||
      expected.level !== assessment.result.level
    )
      throw new DataError(
        'schema',
        'La orientación guardada no coincide con sus respuestas. Revisa el archivo original.',
      );
  }
  return normalizeDatabase(parsed.data);
}
export function parseDatabase(raw: string): AtaraxiaDatabase {
  if (new TextEncoder().encode(raw).length > maximumImportBytes)
    throw new DataError('size', 'El archivo supera el límite de 2 MB.');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new DataError(
      'json',
      'No se pudo leer el JSON. Revisa el archivo o descarga una copia de los datos originales.',
    );
  }
  return validateDatabase(value);
}
function latestRecords<T extends { id: string; updatedAt: string }>(
  records: T[],
): T[] {
  const entries = new Map<string, T>();
  for (const record of records) {
    const previous = entries.get(record.id);
    if (
      !previous ||
      Date.parse(record.updatedAt) > Date.parse(previous.updatedAt)
    )
      entries.set(record.id, record);
  }
  return [...entries.values()];
}
function normalizeDatabase(database: AtaraxiaDatabase): AtaraxiaDatabase {
  return {
    ...database,
    assessments: latestRecords(database.assessments),
    vitalSigns: latestRecords(database.vitalSigns),
    plans: latestRecords(database.plans).map((plan) => ({
      ...plan,
      activities: latestRecords(plan.activities),
    })),
    appointments: latestRecords(database.appointments),
    activityLogs: latestRecords(database.activityLogs),
  };
}
export function mergeDatabase(
  current: AtaraxiaDatabase,
  incoming: AtaraxiaDatabase,
): AtaraxiaDatabase {
  const local = validateDatabase(current);
  const imported = validateDatabase(incoming);
  return validateDatabase({
    ...local,
    profile: !local.profile
      ? imported.profile
      : imported.profile &&
          Date.parse(imported.profile.updatedAt) >
            Date.parse(local.profile.updatedAt)
        ? imported.profile
        : local.profile,
    assessments: latestRecords([...local.assessments, ...imported.assessments]),
    vitalSigns: latestRecords([...local.vitalSigns, ...imported.vitalSigns]),
    plans: latestRecords([...local.plans, ...imported.plans]),
    appointments: latestRecords([
      ...local.appointments,
      ...imported.appointments,
    ]),
    activityLogs: latestRecords([
      ...local.activityLogs,
      ...imported.activityLogs,
    ]),
  });
}
export function previewDatabase(database: AtaraxiaDatabase): ImportPreview {
  return {
    assessments: database.assessments.length,
    vitalSigns: database.vitalSigns.length,
    plans: database.plans.length,
    appointments: database.appointments.length,
    activityLogs: database.activityLogs.length,
  };
}
export function aggregateAssessments(
  records: AssessmentRecord[],
  filters: {
    from?: string;
    to?: string;
    faculty?: string;
    source?: string;
  } = {},
) {
  const filtered = records.filter(
    (record) =>
      (!filters.from || record.createdAt.slice(0, 10) >= filters.from) &&
      (!filters.to || record.createdAt.slice(0, 10) <= filters.to) &&
      (!filters.faculty || record.answers.faculty === filters.faculty) &&
      (!filters.source || record.source === filters.source),
  );
  const count = (values: string[]) =>
    Object.entries(
      values.reduce<Record<string, number>>(
        (acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }),
        {},
      ),
    ).map(([name, value]) => ({ name, value }));
  return {
    total: filtered.length,
    demo: filtered.filter((record) => record.source === 'demo').length,
    levels: count(filtered.map((record) => levelLabels[record.result.level])),
    timeline: count(
      filtered.map((record) => record.createdAt.slice(0, 10)),
    ).sort((a, b) => a.name.localeCompare(b.name)),
    symptoms: count(
      filtered.flatMap((record) =>
        record.answers.symptoms.map((symptom) => symptomLabels[symptom]),
      ),
    ),
    faculties: count(
      filtered.map((record) => facultyLabels[record.answers.faculty]),
    ),
    recent: filtered
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
      .map((record) => ({
        date: record.createdAt.slice(0, 10),
        faculty: facultyLabels[record.answers.faculty],
        level: levelLabels[record.result.level],
        source: record.source,
      })),
  };
}
export function seedDemoData(database: AtaraxiaDatabase): AtaraxiaDatabase {
  if (database.assessments.some((record) => record.source === 'demo'))
    return database;
  const assessments: AssessmentRecord[] = Array.from(
    { length: 12 },
    (_, index) => {
      const answers: AssessmentAnswer = {
        consent: true,
        faculty: (['health', 'engineering', 'humanities', 'business'] as const)[
          index % 4
        ],
        semester: 2,
        stress: index % 4,
        workload: index % 3,
        worry: index % 4,
        restlessness: index % 3,
        symptoms: index % 2 ? ['sleep', 'concentration'] : ['tension'],
        urgent: false,
      };
      const date = new Date(Date.now() - index * 86400000).toISOString();
      return {
        ...metadata(),
        createdAt: date,
        updatedAt: date,
        answers,
        result: scoreAssessment(answers),
        source: 'demo',
      };
    },
  );
  return {
    ...database,
    assessments: [...database.assessments, ...assessments],
  };
}
