import type {
  AssessmentDefinition,
  PublicConfig,
  ResourceArticle,
} from './schemas';
export const institutionDefaults = {
  name: 'Universidad de Linda Vista',
  supportPhone: '+52 9371549923',
} as const;
export const fallbackConfig: PublicConfig = {
  institutionName: institutionDefaults.name,
  fallback: true,
  emergencyResources: [
    {
      id: 'emergency',
      label: 'Emergencias de tu localidad',
      phone: '',
      url: '',
    },
    {
      id: 'institution',
      label: `Apoyo de ${institutionDefaults.name}`,
      phone: institutionDefaults.supportPhone,
      url: '',
    },
  ],
};
export const assessmentDefinition: AssessmentDefinition = {
  id: 'wellbeing-demo',
  version: 1,
  questions: [
    {
      id: 'stress',
      group: 'stress',
      text: '¿Con qué frecuencia has sentido presión académica recientemente?',
    },
    {
      id: 'workload',
      group: 'stress',
      text: '¿Con qué frecuencia las tareas han superado el tiempo que tenías disponible?',
    },
    {
      id: 'worry',
      group: 'thoughts',
      text: '¿Con qué frecuencia te ha costado dejar de pensar en tus pendientes?',
    },
    {
      id: 'restlessness',
      group: 'thoughts',
      text: '¿Con qué frecuencia te has sentido inquieto o inquieta al estudiar?',
    },
  ],
};
const review =
  'Contenido ilustrativo pendiente de revisión clínica institucional.';
export const resources: ResourceArticle[] = [
  {
    id: 'sleep',
    title: 'Un cierre tranquilo para tu día',
    summary: 'Pequeños ajustes para preparar el descanso durante el semestre.',
    category: 'body',
    symptoms: ['sleep'],
    format: 'Guía breve',
    body: [
      'Busca horarios de descanso que puedas sostener y deja un espacio para bajar el ritmo antes de acostarte.',
      'Anota los pendientes para retomarlos mañana. Si las dificultades para dormir persisten o afectan tu día, considera orientación profesional.',
    ],
    review,
  },
  {
    id: 'focus',
    title: 'Recupera un poco de concentración',
    summary: 'Dale a una sola tarea un espacio sin interrupciones.',
    category: 'study',
    symptoms: ['concentration'],
    format: 'Guía breve',
    body: [
      'Elige una tarea pequeña y reduce las interrupciones que estén a tu alcance.',
      'Prueba un periodo de estudio cómodo seguido de una pausa. Ajusta la duración a tus necesidades y busca apoyo si la dificultad persiste.',
    ],
    review,
  },
  {
    id: 'palpitations',
    title: 'Cuando notas tus latidos',
    summary:
      'Observa el contexto sin sacar conclusiones a partir de un solo dato.',
    category: 'body',
    symptoms: ['palpitations'],
    format: 'Guía breve',
    body: [
      'Si notas palpitaciones, pausa la actividad y busca un lugar seguro. Una medición aislada no explica su causa.',
      'Si hay dolor intenso en el pecho, desmayo o dificultad importante para respirar, contacta los servicios de emergencia de tu localidad. Si los síntomas se repiten, consulta a un profesional.',
    ],
    review,
  },
  {
    id: 'tension',
    title: 'Un espacio para soltar la tensión',
    summary: 'Observa tu postura y encuentra una pausa cómoda.',
    category: 'body',
    symptoms: ['tension'],
    format: 'Ejercicio',
    body: [
      'Cambia de posición suavemente y permite que tus hombros descansen. Evita forzar movimientos.',
      'Detente si aparece dolor o malestar. Si las molestias persisten, busca orientación profesional.',
    ],
    review,
  },
  {
    id: 'time',
    title: 'Organiza tu semana con espacio para ti',
    summary: 'Ordena prioridades y deja margen para descansar.',
    category: 'study',
    symptoms: ['concentration'],
    format: 'Guía breve',
    body: [
      'Escribe tus compromisos y elige qué necesita atención primero. Divide las tareas grandes en pasos manejables.',
      'Incluye descansos y revisa qué puedes negociar, posponer o compartir con otras personas.',
    ],
    review,
  },
  {
    id: 'exams',
    title: 'Prepárate para tus próximos exámenes',
    summary: 'Una planificación sencilla para un periodo exigente.',
    category: 'study',
    symptoms: ['sleep', 'concentration'],
    format: 'Guía breve',
    body: [
      'Distribuye los temas en varios momentos y practica recordar lo aprendido. Pide ayuda sobre lo que no comprendes.',
      'Reserva tiempo para descansar y comer. Tu bienestar también forma parte de la preparación.',
    ],
    review,
  },
  {
    id: 'breaks',
    title: 'Pausas pequeñas, espacio para volver',
    summary: 'Descansa la vista y cambia de postura entre tareas.',
    category: 'body',
    symptoms: ['tension'],
    format: 'Ejercicio',
    body: [
      'Aparta la mirada de la pantalla y cambia de postura con suavidad. Camina un poco si te resulta cómodo.',
      'Adapta la pausa a tus posibilidades. Detente si sientes malestar.',
    ],
    review,
  },
  {
    id: 'breathing',
    title: 'Respira sin prisa',
    summary: 'Un momento de atención a tu respiración natural.',
    category: 'mind',
    symptoms: ['tension'],
    format: 'Ejercicio',
    body: [
      'Busca una posición cómoda y observa la respiración sin forzarla ni retener el aire. No hay un ritmo obligatorio.',
      'Detente si aparece mareo o incomodidad y busca orientación profesional cuando corresponda. Esta actividad no sustituye el apoyo urgente.',
    ],
    review,
  },
];
