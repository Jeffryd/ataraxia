import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { fallbackConfig, resources } from '@ataraxia/shared';
import { DatabaseProvider } from '../storage/DatabaseProvider';
import { App } from './App';
vi.mock('../services/api', () => ({
  usePublicConfig: () => ({
    config: fallbackConfig,
    isError: false,
    refetch: vi.fn(),
  }),
  useResources: () => ({
    resources,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
}));
function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <DatabaseProvider>
        <App />
      </DatabaseProvider>
    </MemoryRouter>,
  );
}
describe('accessible routes and navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });
  it.each([
    ['/', 'Encuentra tu calma,'],
    ['/recursos', 'Pequeñas pausas'],
    ['/mi-plan', 'Tu plan personal'],
    ['/datos', 'Tus datos, bajo tu control'],
    ['/privacidad', 'Privacidad en este MVP'],
    ['/missing', 'Este camino no está disponible'],
  ])('renders %s', (route, title) => {
    renderRoute(route);
    expect(
      screen.getByRole('heading', { name: new RegExp(title) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Saltar al contenido' }),
    ).toHaveAttribute('href', '#main');
  });
  it('returns keyboard focus when the mobile menu is dismissed', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    const button = screen.getByRole('button', { name: /Menú/ });
    await user.click(button);
    expect(
      screen.getByRole('navigation', { name: 'Navegación móvil' }),
    ).toBeVisible();
    await user.tab();
    await user.keyboard('{Escape}');
    expect(button).toHaveFocus();
    expect(
      screen.queryByRole('navigation', { name: 'Navegación móvil' }),
    ).not.toBeInTheDocument();
  });
  it('keeps evaluation consent explicit and presents an accessible error', async () => {
    const user = userEvent.setup();
    renderRoute('/evaluacion');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'consentimiento',
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
  it('filters resources and provides a recoverable empty state', async () => {
    const user = userEvent.setup();
    renderRoute('/recursos');
    await user.type(screen.getByLabelText('Buscar recursos'), 'unfindable');
    expect(
      screen.getByRole('heading', {
        name: 'No encontramos recursos con esos filtros',
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Restablecer filtros' }),
    );
    expect(
      screen.getByRole('link', { name: 'Respira sin prisa' }),
    ).toBeInTheDocument();
  });
  it('allows returning from an incomplete step and continuing again', async () => {
    const user = userEvent.setup();
    renderRoute('/evaluacion');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(
      screen.getByRole('heading', { name: 'Antes de empezar' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('Facultad')).toBeInTheDocument();
  });
});
