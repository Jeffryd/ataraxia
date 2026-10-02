import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  categoryLabels,
  symptomLabels,
  type ResourceArticle,
} from '@ataraxia/shared';
import { useResources } from '../../services/api';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Field,
  PageHeader,
} from '../../components/ui';
function ResourceCard({ resource }: { resource: ResourceArticle }) {
  return (
    <Card>
      <Badge>
        {categoryLabels[resource.category]} · {resource.format}
      </Badge>
      <h2 style={{ fontSize: '1.45rem', marginTop: 18 }}>
        <Link to={`/recursos/${resource.id}`}>{resource.title}</Link>
      </h2>
      <p className="muted">{resource.summary}</p>
      <Link to={`/recursos/${resource.id}`}>Leer recurso →</Link>
    </Card>
  );
}
export function Resources() {
  const { resources, isError, isPending, refetch } = useResources();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [symptom, setSymptom] = useState('');
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const filtered = resources.filter(
    (resource) =>
      (!category || category === resource.category) &&
      (!symptom || resource.symptoms.some((value) => value === symptom)) &&
      normalize(`${resource.title} ${resource.summary}`).includes(
        normalize(search),
      ),
  );
  return (
    <>
      <PageHeader
        eyebrow="Información y prevención"
        title="Pequeñas pausas, nuevas herramientas"
      >
        <p>Encuentra ideas para acompañar tu bienestar en la universidad.</p>
      </PageHeader>
      {isPending && (
        <p role="status">
          Conectando con el catálogo. Puedes consultar la copia local.
        </p>
      )}
      {isError && (
        <Alert>
          El catálogo en línea no está disponible. Mostramos los recursos
          locales.{' '}
          <button className="secondary" onClick={() => void refetch()}>
            Reintentar
          </button>
        </Alert>
      )}
      <Card>
        <div className="grid">
          <Field label="Buscar recursos" id="search">
            <input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Descanso, estudio, respiración…"
            />
          </Field>
          <Field label="Categoría" id="category">
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas las categorías</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lo que estás sintiendo" id="symptom">
            <select
              id="symptom"
              value={symptom}
              onChange={(event) => setSymptom(event.target.value)}
            >
              <option value="">Todos los temas</option>
              {Object.entries(symptomLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="actions" style={{ marginTop: 20 }}>
          <span role="status">{filtered.length} recursos</span>
          <button
            className="secondary"
            onClick={() => {
              setSearch('');
              setCategory('');
              setSymptom('');
            }}
          >
            Restablecer filtros
          </button>
        </div>
      </Card>
      <p className="muted" style={{ marginTop: 24 }}>
        <small>
          Contenido ilustrativo pendiente de revisión clínica institucional.
        </small>
      </p>
      <div className="grid">
        {filtered.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
      {!filtered.length && (
        <EmptyState title="No encontramos recursos con esos filtros">
          Prueba otra palabra o restablece los filtros para ver el catálogo.
        </EmptyState>
      )}
    </>
  );
}
export function ResourceDetail() {
  const { resourceId } = useParams();
  const { resources, isError } = useResources();
  const resource = resources.find((item) => item.id === resourceId);
  if (!resource)
    return (
      <EmptyState
        title="No encontramos este recurso"
        to="/recursos"
        label="Ver recursos"
      >
        El enlace puede ser incorrecto. Explora el catálogo disponible.
      </EmptyState>
    );
  return (
    <article className="narrow">
      <Link to="/recursos">← Todos los recursos</Link>
      <PageHeader
        eyebrow={categoryLabels[resource.category]}
        title={resource.title}
      >
        <p>{resource.summary}</p>
      </PageHeader>
      {isError && <Alert>Estás consultando la copia local del recurso.</Alert>}
      <Card>
        <Badge>{resource.format}</Badge>
        {resource.body.map((paragraph) => (
          <p style={{ marginTop: 20 }} key={paragraph}>
            {paragraph}
          </p>
        ))}
        <small className="muted">
          {resource.review} Información educativa; no sustituye atención
          profesional.
        </small>
      </Card>
      <h2 style={{ marginTop: 36 }}>Para seguir explorando</h2>
      <div className="grid">
        {resources
          .filter(
            (item) =>
              item.id !== resource.id && item.category === resource.category,
          )
          .slice(0, 2)
          .map((item) => (
            <ResourceCard key={item.id} resource={item} />
          ))}
      </div>
    </article>
  );
}
