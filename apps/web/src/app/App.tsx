import { Component, Suspense, lazy, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Shell } from '../layouts/Shell';
import { Home } from '../pages/Home';
import { Accessibility, Help, NotFound, Privacy } from '../pages/Information';
import {
  Assessment,
  AssessmentResultPage,
} from '../features/assessment/Assessment';
import { CarePlan } from '../features/care-plan/CarePlan';
import { Appointments } from '../features/appointments/Appointments';
import { VitalSigns } from '../features/vital-signs/VitalSigns';
import { Resources, ResourceDetail } from '../features/resources/Resources';
import { DataTransfer } from '../features/data-transfer/DataTransfer';
const Dashboard = lazy(() =>
  import('../features/dashboard/Dashboard').then((module) => ({
    default: module.Dashboard,
  })),
);
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="recovery">
        <h1>No pudimos mostrar esta página</h1>
        <p>
          Recarga para volver a intentarlo. Los registros guardados no se han
          eliminado.
        </p>
        <button onClick={() => window.location.reload()}>Recargar</button>
        <p>
          Si necesitas ayuda inmediata, contacta los servicios de emergencia
          locales o a una persona de confianza. ATARAXIA no ha contactado a
          nadie.
        </p>
      </main>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  return (
    <Suspense
      fallback={
        <main className="recovery" role="status">
          Preparando tu espacio…
        </main>
      }
    >
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="recursos" element={<Resources />} />
          <Route path="recursos/:resourceId" element={<ResourceDetail />} />
          <Route path="evaluacion" element={<Assessment />} />
          <Route
            path="evaluacion/resultado/:assessmentId"
            element={<AssessmentResultPage />}
          />
          <Route path="signos-vitales" element={<VitalSigns />} />
          <Route path="mi-plan" element={<CarePlan />} />
          <Route path="atencion" element={<Appointments />} />
          <Route path="institucional" element={<Dashboard />} />
          <Route path="datos" element={<DataTransfer />} />
          <Route path="privacidad" element={<Privacy />} />
          <Route path="accesibilidad" element={<Accessibility />} />
          <Route path="ayuda" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
