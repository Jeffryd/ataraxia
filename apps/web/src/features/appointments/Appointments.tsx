import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  appointmentInputSchema,
  metadata,
  type AppointmentInput,
  type AppointmentRecord,
} from '@ataraxia/shared';
import {
  Alert,
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  PageHeader,
} from '../../components/ui';
import { useDatabase } from '../../storage/DatabaseProvider';
const statusLabels = {
  requested: 'Solicitada (simulación)',
  confirmed: 'Confirmada (simulación local)',
  cancelled: 'Cancelada',
  completed: 'Completada (simulación)',
};
function AppointmentForm({
  record,
  onSaved,
  onCancel,
}: {
  record?: AppointmentRecord;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { update, setNotice } = useDatabase();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentInputSchema),
    defaultValues: record
      ? {
          modality: record.modality,
          preferredDate: record.preferredDate,
          preferredTime: record.preferredTime,
          reason: record.reason,
          notes: record.notes,
          status: record.status,
        }
      : {
          modality: 'virtual',
          preferredDate: '',
          preferredTime: '',
          reason: '',
          notes: '',
          status: 'requested',
        },
  });
  return (
    <form
      noValidate
      className="stack"
      onSubmit={handleSubmit((values) => {
        if (
          !record &&
          new Date(
            `${values.preferredDate}T${values.preferredTime}`,
          ).getTime() <= Date.now()
        ) {
          setError('Elige una fecha y hora futuras para la solicitud.');
          return;
        }
        const next = {
          ...(record ?? metadata()),
          ...values,
          updatedAt: new Date().toISOString(),
        };
        if (
          update((current) => ({
            ...current,
            appointments: record
              ? current.appointments.map((item) =>
                  item.id === record.id ? next : item,
                )
              : [...current.appointments, next],
          }))
        ) {
          setNotice(
            'Solicitud simulada guardada. No se notificó a ninguna institución.',
          );
          onSaved();
        }
      })}
    >
      <Field id="modality" label="Modalidad">
        <select id="modality" {...register('modality')}>
          <option value="virtual">Virtual</option>
          <option value="in-person">Presencial</option>
        </select>
      </Field>
      <div className="grid">
        <Field
          id="preferredDate"
          label="Fecha preferida"
          error={
            errors.preferredDate ? 'Selecciona una fecha válida.' : undefined
          }
        >
          <input
            id="preferredDate"
            type="date"
            {...register('preferredDate')}
            aria-invalid={!!errors.preferredDate}
            aria-describedby={
              errors.preferredDate ? 'preferredDate-error' : undefined
            }
          />
        </Field>
        <Field
          id="preferredTime"
          label="Hora preferida"
          error={
            errors.preferredTime ? 'Selecciona una hora válida.' : undefined
          }
        >
          <input
            id="preferredTime"
            type="time"
            {...register('preferredTime')}
            aria-invalid={!!errors.preferredTime}
            aria-describedby={
              errors.preferredTime ? 'preferredTime-error' : undefined
            }
          />
        </Field>
      </div>
      <Field
        id="reason"
        label="Motivo general"
        error={errors.reason ? 'Escribe entre 3 y 200 caracteres.' : undefined}
      >
        <input
          id="reason"
          {...register('reason')}
          aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? 'reason-error' : undefined}
        />
      </Field>
      <Field
        id="notes"
        label="Notas privadas (opcional)"
        error={errors.notes ? 'Máximo 1000 caracteres.' : undefined}
      >
        <textarea
          id="notes"
          {...register('notes')}
          aria-describedby={errors.notes ? 'notes-error' : undefined}
        />
      </Field>
      {record && (
        <Field id="status" label="Estado simulado">
          <select id="status" {...register('status')}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button type="submit">
          {record ? 'Guardar cambios' : 'Guardar solicitud simulada'}
        </button>
        {record && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cerrar edición
          </button>
        )}
      </div>
    </form>
  );
}
export function Appointments() {
  const { database, update, setNotice } = useDatabase();
  const [editing, setEditing] = useState<AppointmentRecord>();
  const [revision, setRevision] = useState(0);
  const [action, setAction] = useState<{
    id: string;
    kind: 'delete' | 'cancel';
  } | null>(null);
  return (
    <>
      <PageHeader
        eyebrow="Modalidades de atención"
        title="Explora un espacio de apoyo"
      >
        <p>Organiza tu preferencia de atención virtual o presencial.</p>
      </PageHeader>
      <Alert>
        Esto es una simulación local: guardar una solicitud no crea una cita
        real. No se notifica a ninguna institución. La confirmación también es
        simulada.
      </Alert>
      <div className="grid">
        <Card>
          <h2>{editing ? 'Editar solicitud' : 'Tu preferencia de atención'}</h2>
          <AppointmentForm
            key={editing?.id ?? revision}
            record={editing}
            onSaved={() => {
              setEditing(undefined);
              setRevision((value) => value + 1);
            }}
            onCancel={() => setEditing(undefined)}
          />
        </Card>
        <section>
          <h2>Historial de solicitudes</h2>
          {!database.appointments.length ? (
            <EmptyState title="Aún no hay solicitudes">
              Completa el formulario para probar el flujo. Para solicitar
              atención real, consulta los contactos de ayuda de tu institución.
            </EmptyState>
          ) : (
            <div className="stack">
              {[...database.appointments]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((record) => (
                  <Card key={record.id}>
                    <Badge>{statusLabels[record.status]}</Badge>
                    <h3 style={{ marginTop: 18 }}>
                      {record.modality === 'virtual'
                        ? 'Atención virtual'
                        : 'Atención presencial'}
                    </h3>
                    <p>
                      {record.preferredDate} · {record.preferredTime}
                    </p>
                    <p>{record.reason}</p>
                    {record.notes && (
                      <p className="muted">Nota privada: {record.notes}</p>
                    )}
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => setEditing(record)}
                      >
                        Editar
                      </button>
                      {record.status !== 'cancelled' &&
                        record.status !== 'completed' && (
                          <button
                            className="secondary"
                            onClick={() =>
                              setAction({ id: record.id, kind: 'cancel' })
                            }
                          >
                            Cancelar solicitud
                          </button>
                        )}
                      <button
                        className="secondary"
                        onClick={() =>
                          setAction({ id: record.id, kind: 'delete' })
                        }
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
        open={!!action}
        title={
          action?.kind === 'delete'
            ? '¿Eliminar la solicitud?'
            : '¿Cancelar la solicitud simulada?'
        }
        onClose={() => setAction(null)}
        onConfirm={() => {
          if (!action) return;
          if (
            update((current) => ({
              ...current,
              appointments:
                action.kind === 'delete'
                  ? current.appointments.filter(
                      (record) => record.id !== action.id,
                    )
                  : current.appointments.map((record) =>
                      record.id === action.id
                        ? {
                            ...record,
                            status: 'cancelled',
                            updatedAt: new Date().toISOString(),
                          }
                        : record,
                    ),
            }))
          ) {
            setEditing(undefined);
            setAction(null);
            setNotice('Historial actualizado en este navegador.');
          }
        }}
      >
        Esta acción solo modifica tus datos locales. No se enviará ninguna
        notificación.
      </ConfirmDialog>
    </>
  );
}
