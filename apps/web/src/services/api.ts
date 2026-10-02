import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  fallbackConfig,
  institutionDefaults,
  publicConfigSchema,
  resourceArticleSchema,
  resources,
} from '@ataraxia/shared';
const configuredFallback = publicConfigSchema.safeParse({
  institutionName:
    import.meta.env.VITE_INSTITUTION_NAME || fallbackConfig.institutionName,
  fallback: true,
  emergencyResources: [
    {
      id: 'emergency',
      label: 'Emergencias de tu localidad',
      phone: import.meta.env.VITE_EMERGENCY_PHONE ?? '',
      url: '',
    },
    {
      id: 'institution',
      label: `Apoyo de ${import.meta.env.VITE_INSTITUTION_NAME || fallbackConfig.institutionName}`,
      phone:
        import.meta.env.VITE_SUPPORT_PHONE ?? institutionDefaults.supportPhone,
      url: import.meta.env.VITE_SUPPORT_URL ?? '',
    },
  ],
});
export const localConfig = configuredFallback.success
  ? configuredFallback.data
  : fallbackConfig;
const baseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');
async function fetchValidated<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('El servicio no está disponible.');
  const result = schema.safeParse(await response.json());
  if (!result.success)
    throw new Error('La respuesta del servicio no es válida.');
  return result.data;
}
export function usePublicConfig() {
  const query = useQuery({
    queryKey: ['config'],
    queryFn: () => fetchValidated('/config', publicConfigSchema),
    retry: 1,
    staleTime: 300000,
  });
  return { ...query, config: query.data ?? localConfig };
}
export function useResources() {
  const query = useQuery({
    queryKey: ['resources'],
    queryFn: () => fetchValidated('/resources', z.array(resourceArticleSchema)),
    retry: 1,
    staleTime: 300000,
  });
  return { ...query, resources: query.data ?? resources };
}
