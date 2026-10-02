import { z } from 'zod';

export const timestampSchema = z.iso.datetime({ offset: true });
export const metadataSchema = z
  .object({
    id: z.uuid(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();
export const levelSchema = z.enum(['low', 'moderate', 'high', 'urgent']);
export const facultySchema = z.enum([
  'health',
  'engineering',
  'humanities',
  'business',
  'other',
]);
export const symptomSchema = z.enum([
  'sleep',
  'concentration',
  'palpitations',
  'tension',
]);
export const studentProfileSchema = metadataSchema
  .extend({ faculty: facultySchema, semester: z.number().int().min(1).max(20) })
  .strict();
export const assessmentAnswerSchema = z
  .object({
    consent: z.literal(true),
    faculty: facultySchema,
    semester: z.number().int().min(1).max(20),
    stress: z.number().int().min(0).max(3),
    workload: z.number().int().min(0).max(3),
    worry: z.number().int().min(0).max(3),
    restlessness: z.number().int().min(0).max(3),
    symptoms: z.array(symptomSchema).max(4),
    urgent: z.boolean(),
  })
  .strict();
export const assessmentDraftSchema = assessmentAnswerSchema
  .partial()
  .extend({ step: z.number().int().min(0).max(6) })
  .strict();
export const assessmentDefinitionSchema = z
  .object({
    id: z.string(),
    version: z.literal(1),
    questions: z.array(
      z
        .object({ id: z.string(), text: z.string(), group: z.string() })
        .strict(),
    ),
  })
  .strict();
export const assessmentResultSchema = z
  .object({
    level: levelSchema,
    score: z.number().int().min(0).max(16),
    ruleVersion: z.literal(1),
  })
  .strict();
export const assessmentRecordSchema = metadataSchema
  .extend({
    answers: assessmentAnswerSchema,
    result: assessmentResultSchema,
    source: z.enum(['user', 'demo']),
  })
  .strict();
export const vitalInputSchema = z
  .object({
    heartRate: z.number().int().min(1).max(350).optional(),
    systolic: z.number().int().min(1).max(400).optional(),
    diastolic: z.number().int().min(1).max(300).optional(),
    respiratoryRate: z.number().int().min(1).max(100).optional(),
    context: z.string().max(300),
    note: z.string().max(1000),
    recordedAt: timestampSchema,
  })
  .strict()
  .refine(
    (value) =>
      [
        value.heartRate,
        value.systolic,
        value.diastolic,
        value.respiratoryRate,
      ].some((item) => item !== undefined),
    { message: 'Registra al menos un valor.' },
  )
  .refine(
    (value) =>
      (value.systolic === undefined) === (value.diastolic === undefined),
    { message: 'Completa ambos valores de presión arterial.' },
  );
export const vitalSignRecordSchema = metadataSchema
  .extend(vitalInputSchema.shape)
  .strict()
  .superRefine((value, ctx) => {
    const result = vitalInputSchema.safeParse(valueWithoutMetadata(value));
    if (!result.success)
      for (const issue of result.error.issues)
        ctx.addIssue({ ...issue, code: 'custom', message: issue.message });
  });
function valueWithoutMetadata(
  value: z.infer<typeof metadataSchema> & z.infer<typeof vitalInputSchema>,
) {
  const {
    heartRate,
    systolic,
    diastolic,
    respiratoryRate,
    context,
    note,
    recordedAt,
  } = value;
  return {
    heartRate,
    systolic,
    diastolic,
    respiratoryRate,
    context,
    note,
    recordedAt,
  };
}
export const carePlanActivitySchema = metadataSchema
  .extend({
    title: z.string().trim().min(1).max(200),
    instructions: z.string().max(1200),
    kind: z.enum(['study', 'breathing', 'grounding', 'break', 'personal']),
    completedAt: timestampSchema.nullable(),
  })
  .strict();
export const carePlanRecordSchema = metadataSchema
  .extend({
    assessmentId: z.uuid(),
    level: levelSchema,
    activities: z.array(carePlanActivitySchema).max(200),
  })
  .strict();
export const appointmentInputSchema = z
  .object({
    modality: z.enum(['virtual', 'in-person']),
    preferredDate: z.iso.date(),
    preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    reason: z.string().trim().min(3).max(200),
    notes: z.string().max(1000),
    status: z.enum(['requested', 'confirmed', 'cancelled', 'completed']),
  })
  .strict();
export const appointmentRecordSchema = metadataSchema
  .extend(appointmentInputSchema.shape)
  .strict();
export const resourceArticleSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    category: z.enum(['body', 'mind', 'study']),
    symptoms: z.array(symptomSchema),
    format: z.string(),
    body: z.array(z.string()),
    review: z.string(),
  })
  .strict();
export const emergencyResourceSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    phone: z.string().regex(/^[+\d ()-]*$/),
    url: z.union([
      z.literal(''),
      z.url().refine((url) => new URL(url).protocol === 'https:'),
    ]),
  })
  .strict();
export const publicConfigSchema = z
  .object({
    institutionName: z.string().min(1),
    emergencyResources: z.array(emergencyResourceSchema),
    fallback: z.boolean(),
  })
  .strict();
export const activityLogRecordSchema = metadataSchema
  .extend({
    activityId: z.uuid(),
    planId: z.uuid(),
    action: z.enum(['completed', 'reopened']),
  })
  .strict();
export const userPreferencesSchema = z
  .object({
    role: z.enum(['student', 'institutional']),
    assessmentDraft: assessmentDraftSchema.nullable(),
  })
  .strict();
export const databaseSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: timestampSchema.optional(),
    profile: studentProfileSchema.nullable(),
    assessments: z.array(assessmentRecordSchema).max(10000),
    vitalSigns: z.array(vitalSignRecordSchema).max(10000),
    plans: z.array(carePlanRecordSchema).max(10000),
    appointments: z.array(appointmentRecordSchema).max(10000),
    activityLogs: z.array(activityLogRecordSchema).max(20000),
    preferences: userPreferencesSchema,
  })
  .strict();
export const importPreviewSchema = z
  .object({
    assessments: z.number().int().nonnegative(),
    vitalSigns: z.number().int().nonnegative(),
    plans: z.number().int().nonnegative(),
    appointments: z.number().int().nonnegative(),
    activityLogs: z.number().int().nonnegative(),
  })
  .strict();
export const importResultSchema = z
  .object({ mode: z.enum(['replace', 'merge']), counts: importPreviewSchema })
  .strict();

export type AtaraxiaDatabase = z.infer<typeof databaseSchema>;
export type StudentProfile = z.infer<typeof studentProfileSchema>;
export type AssessmentDefinition = z.infer<typeof assessmentDefinitionSchema>;
export type AssessmentAnswer = z.infer<typeof assessmentAnswerSchema>;
export type AssessmentDraft = z.infer<typeof assessmentDraftSchema>;
export type AssessmentRecord = z.infer<typeof assessmentRecordSchema>;
export type AssessmentResult = z.infer<typeof assessmentResultSchema>;
export type VitalSignRecord = z.infer<typeof vitalSignRecordSchema>;
export type VitalInput = z.infer<typeof vitalInputSchema>;
export type CarePlanRecord = z.infer<typeof carePlanRecordSchema>;
export type CarePlanActivity = z.infer<typeof carePlanActivitySchema>;
export type AppointmentRecord = z.infer<typeof appointmentRecordSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type ResourceArticle = z.infer<typeof resourceArticleSchema>;
export type EmergencyResource = z.infer<typeof emergencyResourceSchema>;
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export type ActivityLogRecord = z.infer<typeof activityLogRecordSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type ImportPreview = z.infer<typeof importPreviewSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
