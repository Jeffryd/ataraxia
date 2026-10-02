import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  generatePlan,
  levelLabels,
  metadata,
  type CarePlanActivity,
} from '@ataraxia/shared';
import { useDatabase } from '../../storage/DatabaseProvider';
import {
  Alert,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  PageHeader,
  choiceClass,
} from '../../components/ui';
import { SupportPanel } from '../emergency-support/SupportPanel';
export function CarePlan() {
  const { database, update, setNotice } = useDatabase();
  const latest = [...database.assessments]
    .filter((record) => record.source === 'user')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const plan = database.plans.find((item) => item.assessmentId === latest?.id);
  const [goal, setGoal] = useState('');
  const [editing, setEditing] = useState<CarePlanActivity>();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (!latest)
    return (
      <>
        <PageHeader eyebrow="Pequeños pasos" title="Tu plan personal" />
        <EmptyState
          title="Tu plan empieza por escucharte"
          to="/evaluacion"
          label="Iniciar evaluación"
        >
          Completa un autochequeo para crear tu plan de autocuidado. Mientras
          tanto, puedes explorar los recursos preventivos.
        </EmptyState>
        <Link to="/recursos">Explorar recursos</Link>
      </>
    );
  if (latest.result.level === 'urgent')
    return (
      <>
        <PageHeader title="Prioriza el apoyo inmediato" />
        <SupportPanel urgent />
      </>
    );
  if (!plan)
    return (
      <>
        <PageHeader title="Prepara tu plan personal" />
        <Card>
          <p>
            Tu última orientación: {levelLabels[latest.result.level]}. Crea un
            plan a partir de esta evaluación.
          </p>
          <button
            onClick={() =>
              update((current) => ({
                ...current,
                plans: [...current.plans, generatePlan(latest)],
              }))
            }
          >
            Generar mi plan
          </button>
        </Card>
      </>
    );
  const progress = Math.round(
    (plan.activities.filter((activity) => activity.completedAt).length /
      Math.max(plan.activities.length, 1)) *
      100,
  );
  function changeActivities(
    transform: (activities: CarePlanActivity[]) => CarePlanActivity[],
  ) {
    return update((current) => ({
      ...current,
      plans: current.plans.map((item) =>
        item.id === plan?.id
          ? {
              ...item,
              activities: transform(item.activities),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
  }
  return (
    <>
      <PageHeader eyebrow="Pequeños pasos, a tu ritmo" title="Tu plan personal">
        <p>
          {levelLabels[latest.result.level]}.{' '}
          {latest.result.level === 'high'
            ? 'Considera conversar con un profesional.'
            : 'Elige un momento del día para practicar una acción de autocuidado.'}
        </p>
      </PageHeader>
      <Alert>
        Este plan ofrece orientación preventiva. Si una actividad produce
        incomodidad, detente. Puedes buscar apoyo profesional en cualquier
        momento.
      </Alert>
      <Card>
        <div className="actions" style={{ justifyContent: 'space-between' }}>
          <h2>Un espacio en tu día</h2>
          <span>{progress}% completado</span>
        </div>
        <progress
          value={progress}
          max="100"
          aria-label="Actividades completadas"
        />
        <p className="muted">
          {plan.activities.filter((activity) => activity.completedAt).length} de{' '}
          {plan.activities.length} actividades. Sin prisa ni metas obligatorias.
        </p>
        <div className="stack">
          {plan.activities.map((activity) => (
            <div key={activity.id}>
              <label className={choiceClass}>
                <input
                  type="checkbox"
                  checked={!!activity.completedAt}
                  onChange={() => {
                    const now = new Date().toISOString();
                    update((current) => ({
                      ...current,
                      plans: current.plans.map((item) =>
                        item.id === plan.id
                          ? {
                              ...item,
                              updatedAt: now,
                              activities: item.activities.map((entry) =>
                                entry.id === activity.id
                                  ? {
                                      ...entry,
                                      completedAt: entry.completedAt
                                        ? null
                                        : now,
                                      updatedAt: now,
                                    }
                                  : entry,
                              ),
                            }
                          : item,
                      ),
                      activityLogs: [
                        ...current.activityLogs,
                        {
                          ...metadata(),
                          activityId: activity.id,
                          planId: plan.id,
                          action: activity.completedAt
                            ? 'reopened'
                            : 'completed',
                        },
                      ],
                    }));
                  }}
                />
                <strong>{activity.title}</strong>
              </label>
              <p className="muted" style={{ margin: '8px 16px 18px' }}>
                {activity.instructions}
              </p>
              {activity.kind === 'personal' && (
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() => {
                      setEditing(activity);
                      setGoal(activity.title);
                    }}
                  >
                    Editar meta
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setDeleting(activity.id)}
                  >
                    Eliminar meta
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
      <div className="grid" style={{ marginTop: 24 }}>
        <Card>
          <h2>{editing ? 'Editar tu meta' : 'Una meta tuya'}</h2>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (!goal.trim() || goal.length > 200) {
                setError('Escribe una meta de 1 a 200 caracteres.');
                return;
              }
              if (
                changeActivities((activities) =>
                  editing
                    ? activities.map((activity) =>
                        activity.id === editing.id
                          ? {
                              ...activity,
                              title: goal.trim(),
                              updatedAt: new Date().toISOString(),
                            }
                          : activity,
                      )
                    : [
                        ...activities,
                        {
                          ...metadata(),
                          title: goal.trim(),
                          instructions:
                            'Una meta personal que puedes adaptar a tus necesidades.',
                          kind: 'personal',
                          completedAt: null,
                        },
                      ],
                )
              ) {
                setGoal('');
                setEditing(undefined);
                setError('');
                setNotice('Meta guardada.');
              }
            }}
          >
            <Field
              label="¿Qué pequeño paso quieres dar?"
              id="goal"
              error={error}
            >
              <input
                id="goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                maxLength={200}
                aria-describedby={error ? 'goal-error' : undefined}
              />
            </Field>
            <div className="actions">
              <button type="submit">
                {editing ? 'Guardar meta' : 'Añadir meta'}
              </button>
              {editing && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditing(undefined);
                    setGoal('');
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </Card>
        <Card>
          <h2>Tu actividad reciente</h2>
          {database.activityLogs.filter((log) => log.planId === plan.id)
            .length ? (
            <ul>
              {database.activityLogs
                .filter((log) => log.planId === plan.id)
                .slice(-6)
                .reverse()
                .map((log) => (
                  <li key={log.id}>
                    {plan.activities.find(
                      (activity) => activity.id === log.activityId,
                    )?.title ?? 'Meta eliminada'}{' '}
                    ·{' '}
                    {log.action === 'completed'
                      ? 'Completada'
                      : 'Pendiente otra vez'}
                    <br />
                    <small>
                      {new Date(log.createdAt).toLocaleString('es')}
                    </small>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="muted">
              Cuando marques una actividad, aparecerá aquí. Puedes desmarcarla
              para volver a practicar.
            </p>
          )}
        </Card>
      </div>
      <div className="actions" style={{ marginTop: 28 }}>
        <Link className="button" to="/atencion">
          Explorar atención
        </Link>
        <Link className="button secondary" to="/evaluacion">
          Repetir autochequeo
        </Link>
      </div>
      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar esta meta?"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (
            changeActivities((activities) =>
              activities.filter((activity) => activity.id !== deleting),
            )
          ) {
            if (editing?.id === deleting) {
              setEditing(undefined);
              setGoal('');
            }
            setDeleting(null);
          }
        }}
      >
        La meta se quitará de tu plan. Su actividad anterior quedará
        identificada como meta eliminada.
      </ConfirmDialog>
    </>
  );
}
