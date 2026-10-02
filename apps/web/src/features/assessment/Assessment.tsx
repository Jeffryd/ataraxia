import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  assessmentAnswerSchema,
  assessmentDefinition,
  facultyLabels,
  generatePlan,
  levelLabels,
  metadata,
  scoreAssessment,
  symptomLabels,
  type AssessmentDraft,
  type AssessmentRecord,
} from '@ataraxia/shared';
import { useDatabase } from '../../storage/DatabaseProvider';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Field,
  PageHeader,
  choiceClass,
} from '../../components/ui';
import { SupportPanel } from '../emergency-support/SupportPanel';
import { VitalForm } from '../vital-signs/VitalSigns';
const formSchema = assessmentAnswerSchema
  .omit({ consent: true })
  .partial()
  .extend({ consent: z.boolean() });
type FormValues = z.infer<typeof formSchema>;
const steps = [
  'Antes de empezar',
  'Tu contexto académico',
  'Presión académica',
  'Pensamientos y emociones',
  'Tu cuerpo y tu seguridad',
  'Registro opcional',
  'Revisa tus respuestas',
];
const stepFields: (keyof FormValues)[][] = [
  ['consent'],
  ['faculty', 'semester'],
  ['stress', 'workload'],
  ['worry', 'restlessness'],
  ['symptoms', 'urgent'],
  [],
  [],
];
export function Assessment() {
  const { database, update } = useDatabase();
  const draft = database.preferences.assessmentDraft;
  const { step: draftStep, ...draftAnswers } = draft ?? { step: 0 };
  const [step, setStep] = useState(draftStep);
  const [error, setError] = useState('');
  const [urgent, setUrgent] = useState(false);
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);
  const { register, getValues, watch, trigger, setValue } = useForm<FormValues>(
    {
      resolver: zodResolver(formSchema),
      defaultValues: { consent: false, symptoms: [], ...draftAnswers },
    },
  );
  const values = watch();
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  function saveDraft(nextStep: number) {
    const current = getValues();
    const saved: AssessmentDraft = { step: nextStep };
    for (const key of Object.keys(
      assessmentAnswerSchema.shape,
    ) as (keyof FormValues)[]) {
      const parsed = assessmentAnswerSchema.shape[key].safeParse(current[key]);
      if (parsed.success) Object.assign(saved, { [key]: parsed.data });
    }
    return update((db) => ({
      ...db,
      preferences: { ...db.preferences, assessmentDraft: saved },
    }));
  }
  async function goNext() {
    setError('');
    if (stepFields[step].length && !(await trigger(stepFields[step]))) {
      setError('Revisa los valores de este paso.');
      return;
    }
    const current = getValues();
    if (step === 0 && !current.consent) {
      setError(
        'Necesitamos tu consentimiento para guardar este autochequeo local. Puedes explorar los recursos sin aceptarlo.',
      );
      return;
    }
    if (step === 1 && (!current.faculty || !current.semester)) {
      setError('Selecciona tu facultad y semestre.');
      return;
    }
    if (
      (step === 2 &&
        (current.stress === undefined || current.workload === undefined)) ||
      (step === 3 &&
        (current.worry === undefined || current.restlessness === undefined))
    ) {
      setError('Selecciona una respuesta para cada pregunta.');
      return;
    }
    if (step === 4 && current.urgent === undefined) {
      setError('Responde la pregunta de seguridad para continuar.');
      return;
    }
    if (saveDraft(step + 1)) setStep(step + 1);
  }
  function finish(forceUrgent = false) {
    const current = getValues();
    const parsed = assessmentAnswerSchema.safeParse({
      ...current,
      ...(forceUrgent ? { urgent: true } : {}),
    });
    if (!parsed.success) {
      if (forceUrgent) {
        setUrgent(true);
        return;
      }
      setError(
        'Hay respuestas pendientes. Regresa a los pasos anteriores para completarlas.',
      );
      return;
    }
    const assessment: AssessmentRecord = {
      ...metadata(),
      answers: parsed.data,
      result: scoreAssessment(parsed.data),
      source: 'user',
    };
    if (
      update((db) => ({
        ...db,
        profile: {
          ...(db.profile ?? metadata()),
          faculty: parsed.data.faculty,
          semester: parsed.data.semester,
          updatedAt: new Date().toISOString(),
        },
        assessments: [...db.assessments, assessment],
        preferences: { ...db.preferences, assessmentDraft: null },
      }))
    )
      navigate(`/evaluacion/resultado/${assessment.id}`);
    else if (forceUrgent) setUrgent(true);
  }
  if (urgent)
    return (
      <div className="narrow">
        <PageHeader title="Tu seguridad es lo primero" />
        <SupportPanel urgent />
        <Link to="/ayuda">Más opciones de ayuda</Link>
      </div>
    );
  return (
    <div className="narrow">
      <PageHeader
        eyebrow="Evaluación orientativa"
        title="Un momento para escucharte"
      >
        <p>
          Revisa cómo te has sentido recientemente. Este autochequeo
          demostrativo no está validado clínicamente.
        </p>
      </PageHeader>
      <p className="eyebrow">
        Paso {step + 1} de {steps.length} · A tu ritmo
      </p>
      <progress
        value={step + 1}
        max={steps.length}
        aria-label="Progreso de la evaluación"
      />
      <Card>
        <h2 ref={heading} tabIndex={-1}>
          {steps[step]}
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 6) finish();
            else void goNext();
          }}
          noValidate
        >
          <div className="stack">
            {step === 0 && (
              <>
                <p>
                  Las respuestas se guardan en este navegador al continuar o al
                  pulsar «Guardar y salir». No se envían a tu institución.
                  Puedes regresar y cambiar tus respuestas.
                </p>
                <p>
                  El resultado ofrece orientación preventiva; no predice,
                  confirma ni descarta condiciones de salud.
                </p>
                <label className={choiceClass}>
                  <input type="checkbox" {...register('consent')} />
                  Entiendo estas limitaciones y acepto guardar mis respuestas en
                  este navegador.
                </label>
                <Link to="/privacidad">Leer cómo se manejan mis datos</Link>
              </>
            )}
            {step === 1 && (
              <>
                <Field id="faculty" label="Facultad">
                  <select id="faculty" {...register('faculty')}>
                    <option value="">Selecciona tu facultad</option>
                    {Object.entries(facultyLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="semester" label="Semestre">
                  <input
                    id="semester"
                    type="number"
                    min="1"
                    max="20"
                    {...register('semester', { valueAsNumber: true })}
                  />
                </Field>
              </>
            )}
            {(step === 2 || step === 3) &&
              assessmentDefinition.questions
                .filter(
                  (question) =>
                    question.group === (step === 2 ? 'stress' : 'thoughts'),
                )
                .map((question) => (
                  <fieldset key={question.id}>
                    <legend>{question.text}</legend>
                    <div className="stack">
                      {[
                        'Nunca',
                        'Algunas veces',
                        'Con frecuencia',
                        'Casi siempre',
                      ].map((label, index) => (
                        <label key={label} className={choiceClass}>
                          <input
                            type="radio"
                            value={index}
                            name={question.id}
                            checked={
                              values[
                                question.id as
                                  | 'stress'
                                  | 'workload'
                                  | 'worry'
                                  | 'restlessness'
                              ] === index
                            }
                            onChange={() =>
                              setValue(
                                question.id as
                                  | 'stress'
                                  | 'workload'
                                  | 'worry'
                                  | 'restlessness',
                                index,
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
            {step === 4 && (
              <>
                <fieldset>
                  <legend>
                    ¿Qué has notado recientemente? Puedes no seleccionar ninguna
                    opción.
                  </legend>
                  <div className="stack">
                    {Object.entries(symptomLabels).map(([value, label]) => (
                      <label key={value} className={choiceClass}>
                        <input
                          type="checkbox"
                          value={value}
                          {...register('symptoms')}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>
                    ¿Estás en peligro inmediato o sientes que podrías hacerte
                    daño y necesitas ayuda ahora?
                  </legend>
                  <div className="stack">
                    <label className={choiceClass}>
                      <input
                        type="radio"
                        checked={values.urgent === false}
                        name="urgent"
                        onChange={() => setValue('urgent', false)}
                        value="false"
                      />
                      No
                    </label>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => finish(true)}
                    >
                      Sí, necesito apoyo ahora
                    </button>
                  </div>
                </fieldset>
              </>
            )}
            {step === 5 && (
              <p>
                Puedes omitir este registro. Si guardas una medición, quedará
                disponible en tu historial de signos vitales. No se utiliza para
                calcular tu orientación.
              </p>
            )}
            {step === 6 && (
              <>
                <Alert>
                  La puntuación es una demostración sin validación clínica. No
                  constituye un diagnóstico.
                </Alert>
                <dl>
                  <dt>Facultad</dt>
                  <dd>{values.faculty && facultyLabels[values.faculty]}</dd>
                  <dt>Semestre</dt>
                  <dd>{values.semester}</dd>
                  {assessmentDefinition.questions.map((question) => (
                    <div key={question.id}>
                      <dt>{question.text}</dt>
                      <dd>
                        {
                          [
                            'Nunca',
                            'Algunas veces',
                            'Con frecuencia',
                            'Casi siempre',
                          ][values[question.id as 'stress'] ?? 0]
                        }
                      </dd>
                    </div>
                  ))}
                  <dt>Señales seleccionadas</dt>
                  <dd>
                    {values.symptoms
                      ?.map((symptom) => symptomLabels[symptom])
                      .join(', ') || 'Ninguna'}
                  </dd>
                  <dt>Necesidad de apoyo inmediato</dt>
                  <dd>No</dd>
                </dl>
              </>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="actions">
              {step > 0 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setError('');
                    if (saveDraft(step - 1)) setStep(step - 1);
                  }}
                >
                  Atrás
                </button>
              )}
              <button type="submit">
                {step === 6
                  ? 'Ver mi orientación'
                  : step === 5
                    ? 'Continuar sin más registros'
                    : 'Continuar'}
              </button>
              {values.consent && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    if (saveDraft(step)) navigate('/');
                  }}
                >
                  Guardar y salir
                </button>
              )}
            </div>
          </div>
        </form>
        {step === 5 && (
          <div style={{ marginTop: 32 }}>
            <h3>Registro opcional de signos vitales</h3>
            <VitalForm />
          </div>
        )}
      </Card>
    </div>
  );
}
export function AssessmentResultPage() {
  const { assessmentId } = useParams();
  const { database, update } = useDatabase();
  const navigate = useNavigate();
  const assessment = database.assessments.find(
    (record) => record.id === assessmentId,
  );
  if (!assessment)
    return (
      <EmptyState
        title="No encontramos esta evaluación"
        to="/evaluacion"
        label="Iniciar una evaluación"
      >
        El resultado no está guardado en este navegador. Puedes importar tus
        datos o hacer un nuevo autochequeo.
      </EmptyState>
    );
  return (
    <div className="narrow">
      <PageHeader
        eyebrow="Resultado preliminar de bienestar"
        title={levelLabels[assessment.result.level]}
      >
        <p>Esta orientación no es un diagnóstico ni una evaluación clínica.</p>
      </PageHeader>
      {assessment.result.level === 'urgent' ? (
        <Card>
          <SupportPanel urgent />
        </Card>
      ) : (
        <Card>
          <Badge>
            {new Date(assessment.createdAt).toLocaleDateString('es')}
          </Badge>
          <h2 style={{ marginTop: 20 }}>Tu siguiente paso</h2>
          <p>
            {assessment.result.level === 'high'
              ? 'Considera conversar con un profesional para revisar cómo te has sentido y recibir orientación individual.'
              : assessment.result.level === 'moderate'
                ? 'Reserva un momento de autocuidado y considera conversar con un profesional si el malestar persiste.'
                : 'Puedes incorporar pequeñas acciones de autocuidado y revisar cómo te sientes con el tiempo.'}
          </p>
          <Alert>
            Este resultado usa reglas de demostración no validadas clínicamente.
            No confirma ni descarta una condición.
          </Alert>
          <div className="actions">
            <button
              onClick={() => {
                if (
                  database.plans.some(
                    (plan) => plan.assessmentId === assessment.id,
                  )
                ) {
                  navigate('/mi-plan');
                  return;
                }
                if (
                  update((current) => ({
                    ...current,
                    plans: [...current.plans, generatePlan(assessment)],
                  }))
                )
                  navigate('/mi-plan');
              }}
            >
              Crear o ver mi plan
            </button>
            <Link className="button secondary" to="/atencion">
              Explorar atención
            </Link>
          </div>
        </Card>
      )}
      <p style={{ marginTop: 24 }}>
        <Link to="/evaluacion">Volver a evaluar cómo me siento</Link> ·{' '}
        <Link to="/datos">Mis datos</Link>
      </p>
    </div>
  );
}
