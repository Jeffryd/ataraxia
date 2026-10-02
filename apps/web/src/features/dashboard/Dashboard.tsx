import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  aggregateAssessments,
  facultyLabels,
  seedDemoData,
} from '@ataraxia/shared';
import { useDatabase } from '../../storage/DatabaseProvider';
import {
  Alert,
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  PageHeader,
} from '../../components/ui';
function Chart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  return (
    <Card>
      <h2 style={{ fontSize: '1.5rem' }}>{title}</h2>
      {data.length ? (
        <>
          <div
            style={{ height: 240, width: '100%', minWidth: 0 }}
            aria-hidden="true"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ left: 0, right: 10, bottom: 8 }}
                accessibilityLayer={false}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={false} />
                <YAxis allowDecimals={false} width={28} />
                <Tooltip />
                <Bar
                  name="Evaluaciones"
                  dataKey="value"
                  fill="var(--teal)"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul aria-label={`Resumen: ${title}`}>
            {data.map((item) => (
              <li key={item.name}>
                {item.name}: {item.value}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No hay datos para esta distribución con los filtros actuales.</p>
      )}
    </Card>
  );
}
export function Dashboard() {
  const { database, update, setNotice } = useDatabase();
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    faculty: '',
    source: '',
  });
  const [remove, setRemove] = useState(false);
  const data = aggregateAssessments(database.assessments, filters);
  if (database.preferences.role !== 'institutional')
    return (
      <>
        <PageHeader title="Panel institucional de demostración" />
        <Card>
          <p>
            Este panel resume exclusivamente los registros de este navegador. La
            vista institucional no requiere autenticación y no constituye un
            control de acceso.
          </p>
          <button
            onClick={() =>
              update((current) => ({
                ...current,
                preferences: { ...current.preferences, role: 'institutional' },
              }))
            }
          >
            Activar vista institucional de demostración
          </button>
        </Card>
      </>
    );
  return (
    <>
      <PageHeader
        eyebrow="Vista institucional · Demostración"
        title="Una mirada al bienestar local"
      >
        <p>
          Información agregada del navegador actual. No representa una base
          institucional ni transmite datos.
        </p>
      </PageHeader>
      <Alert>
        Vista de demostración sin autenticación. Se excluyen notas,
        identificadores, respuestas detalladas y datos de contacto. Los
        registros de ejemplo están etiquetados.
      </Alert>
      <Card>
        <div className="grid">
          <Field id="from" label="Desde">
            <input
              id="from"
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters({ ...filters, from: event.target.value })
              }
            />
          </Field>
          <Field id="to" label="Hasta">
            <input
              id="to"
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters({ ...filters, to: event.target.value })
              }
            />
          </Field>
          <Field id="facultyFilter" label="Facultad">
            <select
              id="facultyFilter"
              value={filters.faculty}
              onChange={(event) =>
                setFilters({ ...filters, faculty: event.target.value })
              }
            >
              <option value="">Todas</option>
              {Object.entries(facultyLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="source" label="Origen">
            <select
              id="source"
              value={filters.source}
              onChange={(event) =>
                setFilters({ ...filters, source: event.target.value })
              }
            >
              <option value="">Todos, identificados por origen</option>
              <option value="user">Registros del usuario</option>
              <option value="demo">Solo demostración</option>
            </select>
          </Field>
        </div>
        <div className="actions" style={{ marginTop: 20 }}>
          <button
            className="secondary"
            onClick={() =>
              setFilters({ from: '', to: '', faculty: '', source: '' })
            }
          >
            Restablecer filtros
          </button>
          <button
            className="secondary"
            onClick={() => {
              if (update(seedDemoData))
                setNotice(
                  'Datos de demostración disponibles. No son información institucional real.',
                );
            }}
          >
            Cargar ejemplos
          </button>
          <button
            className="secondary"
            disabled={
              !database.assessments.some((record) => record.source === 'demo')
            }
            onClick={() => setRemove(true)}
          >
            Quitar ejemplos
          </button>
        </div>
        {filters.from && filters.to && filters.from > filters.to && (
          <p className="error" role="alert">
            La fecha inicial debe ser anterior a la final.
          </p>
        )}
      </Card>
      <div className="grid" style={{ marginTop: 24 }}>
        <Card>
          <p className="muted">Evaluaciones en el filtro</p>
          <h2>{data.total}</h2>
        </Card>
        <Card>
          <p className="muted">Registros del usuario</p>
          <h2>{data.total - data.demo}</h2>
        </Card>
        <Card>
          <p className="muted">Registros de demostración</p>
          <h2>{data.demo}</h2>
          <Badge>Ejemplos ficticios</Badge>
        </Card>
      </div>
      {!data.total ? (
        <EmptyState title="Aún no hay datos para mostrar">
          Completa una evaluación, importa una copia válida o carga ejemplos. Si
          ya hay registros, revisa los filtros.
        </EmptyState>
      ) : (
        <>
          <div className="grid" style={{ marginTop: 24 }}>
            <Chart title="Nivel de orientación" data={data.levels} />
            <Chart
              title="Evaluaciones a lo largo del tiempo"
              data={data.timeline}
            />
          </div>
          <div className="grid" style={{ marginTop: 24 }}>
            <Chart title="Señales seleccionadas" data={data.symptoms} />
            <Chart title="Distribución por facultad" data={data.faculties} />
          </div>
          <Card className="stack">
            <h2>Registros recientes sin identificadores</h2>
            <p className="muted">
              Resumen por fecha, facultad y orientación. No se muestran
              respuestas individuales.
            </p>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Últimas ocho evaluaciones del filtro
                </caption>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Facultad</th>
                    <th>Orientación</th>
                    <th>Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td>{record.faculty}</td>
                      <td>{record.level}</td>
                      <td>
                        {record.source === 'demo'
                          ? 'Demostración'
                          : 'Usuario local'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      <ConfirmDialog
        open={remove}
        title="¿Quitar los ejemplos?"
        onClose={() => setRemove(false)}
        onConfirm={() => {
          if (
            update((current) => ({
              ...current,
              assessments: current.assessments.filter(
                (record) => record.source !== 'demo',
              ),
            }))
          )
            setRemove(false);
        }}
      >
        Se eliminarán solo las evaluaciones ficticias de demostración.
      </ConfirmDialog>
    </>
  );
}
