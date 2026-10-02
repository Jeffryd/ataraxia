import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  metadata,
  vitalInputSchema,
  type VitalSignRecord,
} from '@ataraxia/shared';
import {
  Alert,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  PageHeader,
} from '../../components/ui';
import { useDatabase } from '../../storage/DatabaseProvider';
const formSchema = z.object({
  heartRate: z.string(),
  systolic: z.string(),
  diastolic: z.string(),
  respiratoryRate: z.string(),
  context: z.string().max(300, 'Máximo 300 caracteres.'),
  note: z.string().max(1000, 'Máximo 1000 caracteres.'),
  recordedAt: z.string().min(1, 'Selecciona la fecha y la hora.'),
});
type VitalFormValues = z.infer<typeof formSchema>;
const fields = [
  ['heartRate', 'Frecuencia cardíaca (latidos/min)'],
  ['systolic', 'Presión sistólica (mmHg)'],
  ['diastolic', 'Presión diastólica (mmHg)'],
  ['respiratoryRate', 'Frecuencia respiratoria (respiraciones/min)'],
] as const;
function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function VitalForm({
  record,
  onSaved,
  onCancel,
}: {
  record?: VitalSignRecord;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { update, setNotice } = useDatabase();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VitalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heartRate: record?.heartRate?.toString() ?? '',
      systolic: record?.systolic?.toString() ?? '',
      diastolic: record?.diastolic?.toString() ?? '',
      respiratoryRate: record?.respiratoryRate?.toString() ?? '',
      context: record?.context ?? '',
      note: record?.note ?? '',
      recordedAt: localDate(record?.recordedAt ?? new Date().toISOString()),
    },
  });
  return (
    <form
      noValidate
      className="stack"
      onSubmit={handleSubmit((values) => {
        setError('');
        const date = new Date(values.recordedAt);
        if (!Number.isFinite(date.getTime())) {
          setError('Revisa la fecha y la hora.');
          return;
        }
        const parsed = vitalInputSchema.safeParse({
          ...values,
          ...Object.fromEntries(
            fields.map(([key]) => [
              key,
              values[key] === '' ? undefined : Number(values[key]),
            ]),
          ),
          recordedAt: date.toISOString(),
        });
        if (!parsed.success) {
          setError(
            'Revisa el formato: usa números enteros positivos, completa ambos valores de presión y registra al menos una medición. Los límites de entrada no son rangos clínicos.',
          );
          return;
        }
        const next: VitalSignRecord = {
          ...(record ?? metadata()),
          ...parsed.data,
          updatedAt: new Date().toISOString(),
        };
        if (
          update((current) => ({
            ...current,
            vitalSigns: record
              ? current.vitalSigns.map((item) =>
                  item.id === record.id ? next : item,
                )
              : [...current.vitalSigns, next],
          }))
        ) {
          setNotice('Registro guardado en este navegador.');
          reset();
          onSaved?.();
        }
      })}
    >
      <div className="grid">
        {fields.map(([key, label]) => (
          <Field key={key} id={`vital-${key}`} label={label}>
            <input
              id={`vital-${key}`}
              type="number"
              min="1"
              step="1"
              {...register(key)}
            />
          </Field>
        ))}
      </div>
      <Field
        id="recordedAt"
        label="Fecha y hora del registro"
        error={errors.recordedAt?.message}
      >
        <input
          id="recordedAt"
          type="datetime-local"
          {...register('recordedAt')}
          aria-invalid={!!errors.recordedAt}
          aria-describedby={errors.recordedAt ? 'recordedAt-error' : undefined}
        />
      </Field>
      <Field
        id="context"
        label="Contexto o desencadenante (opcional)"
        error={errors.context?.message}
      >
        <input
          id="context"
          {...register('context')}
          aria-describedby={errors.context ? 'context-error' : undefined}
        />
      </Field>
      <Field
        id="note"
        label="Nota privada (opcional)"
        error={errors.note?.message}
      >
        <textarea
          id="note"
          {...register('note')}
          aria-describedby={errors.note ? 'note-error' : undefined}
        />
      </Field>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="actions">
        <button type="submit">
          {record ? 'Guardar cambios' : 'Guardar registro'}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
}
export function VitalSigns() {
  const { database, update, setNotice } = useDatabase();
  const [editing, setEditing] = useState<VitalSignRecord>();
  const [deleting, setDeleting] = useState<string | null>(null);
  return (
    <>
      <PageHeader eyebrow="Cuerpo y contexto" title="Tus signos vitales">
        <p>
          Un registro opcional de valores que tú reportas. No interpreta
          mediciones ni sustituye una valoración profesional.
        </p>
      </PageHeader>
      <Alert>
        Datos privados en este navegador. Una medición aislada no permite
        establecer un diagnóstico.
      </Alert>
      <div className="grid">
        <Card>
          <h2>{editing ? 'Editar registro' : 'Añadir un registro'}</h2>
          <VitalForm
            key={editing?.id ?? 'new'}
            record={editing}
            onSaved={() => setEditing(undefined)}
            onCancel={editing ? () => setEditing(undefined) : undefined}
          />
        </Card>
        <section>
          <h2>Tu historial</h2>
          {!database.vitalSigns.length ? (
            <EmptyState title="Aún no hay registros">
              Si deseas llevar un historial, añade una medición en el
              formulario. Este paso es opcional.
            </EmptyState>
          ) : (
            <div className="stack">
              {[...database.vitalSigns]
                .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
                .map((record) => (
                  <Card key={record.id}>
                    <h3>{new Date(record.recordedAt).toLocaleString('es')}</h3>
                    <dl>
                      {fields
                        .filter(([key]) => record[key] !== undefined)
                        .map(([key, label]) => (
                          <div key={key}>
                            <dt className="muted">{label}</dt>
                            <dd>{record[key]}</dd>
                          </div>
                        ))}
                    </dl>
                    {record.context && <p>{record.context}</p>}
                    {record.note && (
                      <p>
                        <small>Nota privada: {record.note}</small>
                      </p>
                    )}
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => {
                          setEditing(record);
                          window.scrollTo({ top: 0, behavior: 'instant' });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="secondary"
                        onClick={() => setDeleting(record.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar este registro?"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (
            update((current) => ({
              ...current,
              vitalSigns: current.vitalSigns.filter(
                (record) => record.id !== deleting,
              ),
            }))
          ) {
            if (editing?.id === deleting) setEditing(undefined);
            setDeleting(null);
            setNotice('Registro eliminado.');
          }
        }}
      >
        La medición y su nota privada se eliminarán de este navegador.
      </ConfirmDialog>
    </>
  );
}
