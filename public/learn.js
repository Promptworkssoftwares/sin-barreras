import { guidedScroll, guidedTop } from './navigation-flow.js?v=1.4.44';

const LEARN_STATE_KEY = 'sinBarreras.learn.v1';
const DAILY_XP_GOAL = 50;
const LESSON_SIZE = 8;
const WORDS_PER_LEVEL = 8;
const SESSIONS_PER_LEVEL = 5;

const COURSES = [
  {
    id: 'everyday', icon: '☀️', title: 'Vida diaria', subtitle: 'Frases y palabras para el día a día',
    words: [
      { word: 'hello', meaning: 'hola', emoji: '👋', example: 'Hello, how are you?', exampleMeaning: 'Hola, ¿cómo estás?' },
      { word: 'please', meaning: 'por favor', emoji: '🙏', example: 'Please, can you help me?', exampleMeaning: 'Por favor, ¿puedes ayudarme?' },
      { word: 'thank you', meaning: 'gracias', emoji: '💛', example: 'Thank you for your help.', exampleMeaning: 'Gracias por tu ayuda.' },
      { word: 'today', meaning: 'hoy', emoji: '📅', example: 'I work today.', exampleMeaning: 'Trabajo hoy.' },
      { word: 'tomorrow', meaning: 'mañana', emoji: '🌅', example: 'I will call tomorrow.', exampleMeaning: 'Llamaré mañana.' },
      { word: 'help', meaning: 'ayuda / ayudar', emoji: '🤝', example: 'I need help.', exampleMeaning: 'Necesito ayuda.' },
      { word: 'where', meaning: 'dónde', emoji: '📍', example: 'Where is the bathroom?', exampleMeaning: '¿Dónde está el baño?' },
      { word: 'how much', meaning: 'cuánto cuesta', emoji: '💵', example: 'How much is this?', exampleMeaning: '¿Cuánto cuesta esto?' }
    ]
  },
  {
    id: 'work', icon: '💼', title: 'Trabajo', subtitle: 'Comunícate mejor en el trabajo',
    words: [
      { word: 'supervisor', meaning: 'supervisor / encargado', emoji: '🧑‍💼', example: 'I need to speak with my supervisor.', exampleMeaning: 'Necesito hablar con mi supervisor.' },
      { word: 'schedule', meaning: 'horario', emoji: '🗓️', example: 'What is my schedule?', exampleMeaning: '¿Cuál es mi horario?' },
      { word: 'break', meaning: 'descanso', emoji: '☕', example: 'Can I take my break?', exampleMeaning: '¿Puedo tomar mi descanso?' },
      { word: 'shift', meaning: 'turno de trabajo', emoji: '⏰', example: 'My shift starts at seven.', exampleMeaning: 'Mi turno empieza a las siete.' },
      { word: 'paycheck', meaning: 'cheque de pago', emoji: '💰', example: 'When do I get my paycheck?', exampleMeaning: '¿Cuándo recibo mi cheque?' },
      { word: 'overtime', meaning: 'horas extra', emoji: '⌛', example: 'Is overtime available?', exampleMeaning: '¿Hay horas extra disponibles?' },
      { word: 'coworker', meaning: 'compañero de trabajo', emoji: '👥', example: 'My coworker can help.', exampleMeaning: 'Mi compañero puede ayudar.' },
      { word: 'meeting', meaning: 'reunión', emoji: '🗣️', example: 'We have a meeting at ten.', exampleMeaning: 'Tenemos una reunión a las diez.' }
    ]
  },
  {
    id: 'construction', icon: '👷', title: 'Construcción', subtitle: 'Herramientas, seguridad y trabajo de campo',
    words: [
      { word: 'harness', meaning: 'arnés', emoji: '🦺', example: 'Check your harness before climbing.', exampleMeaning: 'Revisa tu arnés antes de subir.' },
      { word: 'helmet', meaning: 'casco', emoji: '⛑️', example: 'Wear your helmet.', exampleMeaning: 'Usa tu casco.' },
      { word: 'ladder', meaning: 'escalera', emoji: '🪜', example: 'Secure the ladder.', exampleMeaning: 'Asegura la escalera.' },
      { word: 'tools', meaning: 'herramientas', emoji: '🧰', example: 'Bring the tools.', exampleMeaning: 'Trae las herramientas.' },
      { word: 'safety', meaning: 'seguridad', emoji: '🛡️', example: 'Safety comes first.', exampleMeaning: 'La seguridad es primero.' },
      { word: 'anchor', meaning: 'anclaje', emoji: '⚓', example: 'Use the correct anchor point.', exampleMeaning: 'Usa el punto de anclaje correcto.' },
      { word: 'rope', meaning: 'soga / cuerda', emoji: '🪢', example: 'Inspect the rope.', exampleMeaning: 'Inspecciona la cuerda.' },
      { word: 'ground', meaning: 'tierra / conexión a tierra', emoji: '⚡', example: 'Check the ground connection.', exampleMeaning: 'Revisa la conexión a tierra.' }
    ]
  },
  {
    id: 'medical', icon: '🏥', title: 'Doctor', subtitle: 'Síntomas, citas e instrucciones',
    words: [
      { word: 'appointment', meaning: 'cita', emoji: '📆', example: 'I have an appointment today.', exampleMeaning: 'Tengo una cita hoy.' },
      { word: 'pain', meaning: 'dolor', emoji: '😣', example: 'I have pain in my back.', exampleMeaning: 'Tengo dolor en la espalda.' },
      { word: 'medicine', meaning: 'medicina', emoji: '💊', example: 'Do I need medicine?', exampleMeaning: '¿Necesito medicina?' },
      { word: 'allergy', meaning: 'alergia', emoji: '🤧', example: 'I have a medication allergy.', exampleMeaning: 'Tengo alergia a un medicamento.' },
      { word: 'fever', meaning: 'fiebre', emoji: '🌡️', example: 'I have a fever.', exampleMeaning: 'Tengo fiebre.' },
      { word: 'insurance', meaning: 'seguro médico', emoji: '🪪', example: 'Here is my insurance card.', exampleMeaning: 'Aquí está mi tarjeta del seguro.' },
      { word: 'pharmacy', meaning: 'farmacia', emoji: '⚕️', example: 'Which pharmacy should I use?', exampleMeaning: '¿Qué farmacia debo usar?' },
      { word: 'emergency', meaning: 'emergencia', emoji: '🚑', example: 'This is an emergency.', exampleMeaning: 'Esto es una emergencia.' }
    ]
  },
  {
    id: 'shopping', icon: '🛒', title: 'Compras', subtitle: 'Precios, pagos y productos',
    words: [
      { word: 'price', meaning: 'precio', emoji: '🏷️', example: 'What is the price?', exampleMeaning: '¿Cuál es el precio?' },
      { word: 'receipt', meaning: 'recibo', emoji: '🧾', example: 'Can I get a receipt?', exampleMeaning: '¿Me puede dar un recibo?' },
      { word: 'cash', meaning: 'efectivo', emoji: '💵', example: 'I will pay with cash.', exampleMeaning: 'Pagaré en efectivo.' },
      { word: 'card', meaning: 'tarjeta', emoji: '💳', example: 'Can I pay by card?', exampleMeaning: '¿Puedo pagar con tarjeta?' },
      { word: 'return', meaning: 'devolver', emoji: '↩️', example: 'I need to return this.', exampleMeaning: 'Necesito devolver esto.' },
      { word: 'size', meaning: 'talla / tamaño', emoji: '👕', example: 'Do you have my size?', exampleMeaning: '¿Tiene mi talla?' },
      { word: 'open', meaning: 'abierto', emoji: '🔓', example: 'Are you open today?', exampleMeaning: '¿Están abiertos hoy?' },
      { word: 'closed', meaning: 'cerrado', emoji: '🔒', example: 'The store is closed.', exampleMeaning: 'La tienda está cerrada.' }
    ]
  },
  {
    id: 'restaurant', icon: '🍽️', title: 'Restaurante', subtitle: 'Menú, pedidos y servicio',
    words: [
      { word: 'menu', meaning: 'menú', emoji: '📋', example: 'Can I see the menu?', exampleMeaning: '¿Puedo ver el menú?' },
      { word: 'water', meaning: 'agua', emoji: '💧', example: 'Can I have some water?', exampleMeaning: '¿Me puede traer agua?' },
      { word: 'coffee', meaning: 'café', emoji: '☕', example: 'I would like coffee.', exampleMeaning: 'Quisiera café.' },
      { word: 'order', meaning: 'orden / pedir', emoji: '📝', example: 'I am ready to order.', exampleMeaning: 'Estoy listo para ordenar.' },
      { word: 'bill', meaning: 'cuenta', emoji: '🧾', example: 'Can I get the bill?', exampleMeaning: '¿Me trae la cuenta?' },
      { word: 'tip', meaning: 'propina', emoji: '💸', example: 'The tip is included.', exampleMeaning: 'La propina está incluida.' },
      { word: 'spicy', meaning: 'picante', emoji: '🌶️', example: 'Is this spicy?', exampleMeaning: '¿Esto es picante?' },
      { word: 'table', meaning: 'mesa', emoji: '🪑', example: 'A table for two, please.', exampleMeaning: 'Una mesa para dos, por favor.' }
    ]
  },
  {
    id: 'interview', icon: '🤝', title: 'Entrevista', subtitle: 'Experiencia, preguntas y respuestas',
    words: [
      { word: 'experience', meaning: 'experiencia', emoji: '📚', example: 'I have five years of experience.', exampleMeaning: 'Tengo cinco años de experiencia.' },
      { word: 'available', meaning: 'disponible', emoji: '✅', example: 'I am available on Monday.', exampleMeaning: 'Estoy disponible el lunes.' },
      { word: 'skills', meaning: 'habilidades', emoji: '🧠', example: 'These are my main skills.', exampleMeaning: 'Estas son mis habilidades principales.' },
      { word: 'salary', meaning: 'salario', emoji: '💵', example: 'What is the salary range?', exampleMeaning: '¿Cuál es el rango salarial?' },
      { word: 'position', meaning: 'puesto / posición', emoji: '💼', example: 'I am interested in this position.', exampleMeaning: 'Estoy interesado en este puesto.' },
      { word: 'hire', meaning: 'contratar', emoji: '✍️', example: 'When are you looking to hire?', exampleMeaning: '¿Cuándo buscan contratar?' },
      { word: 'resume', meaning: 'currículum', emoji: '📄', example: 'Here is my resume.', exampleMeaning: 'Aquí está mi currículum.' },
      { word: 'strength', meaning: 'fortaleza', emoji: '💪', example: 'My strength is teamwork.', exampleMeaning: 'Mi fortaleza es el trabajo en equipo.' }
    ]
  },
  {
    id: 'school', icon: '🏫', title: 'Escuela', subtitle: 'Maestros, oficina y familia',
    words: [
      { word: 'teacher', meaning: 'maestro / maestra', emoji: '🧑‍🏫', example: 'I need to speak with the teacher.', exampleMeaning: 'Necesito hablar con la maestra.' },
      { word: 'homework', meaning: 'tarea', emoji: '📚', example: 'Does my child have homework?', exampleMeaning: '¿Mi hijo tiene tarea?' },
      { word: 'grade', meaning: 'nota / calificación', emoji: '📝', example: 'What is the current grade?', exampleMeaning: '¿Cuál es la calificación actual?' },
      { word: 'class', meaning: 'clase', emoji: '🎒', example: 'What time does class start?', exampleMeaning: '¿A qué hora empieza la clase?' },
      { word: 'pickup', meaning: 'recogida', emoji: '🚗', example: 'Where is the pickup area?', exampleMeaning: '¿Dónde está el área de recogida?' },
      { word: 'absence', meaning: 'ausencia', emoji: '📋', example: 'I need to report an absence.', exampleMeaning: 'Necesito reportar una ausencia.' },
      { word: 'principal', meaning: 'director / directora', emoji: '🏫', example: 'Can I speak with the principal?', exampleMeaning: '¿Puedo hablar con el director?' },
      { word: 'permission', meaning: 'permiso', emoji: '✅', example: 'Do I need to sign a permission form?', exampleMeaning: '¿Necesito firmar un permiso?' }
    ]
  }
];


const EXTRA_WORDS = {
  everyday: `yes|sí\nno|no\nexcuse me|disculpe\nsorry|lo siento\ngood morning|buenos días\ngood night|buenas noches\nnow|ahora\nlater|más tarde\nleft|izquierda\nright|derecha\nstraight|derecho / recto\nbathroom|baño\naddress|dirección\nphone|teléfono\nname|nombre\nfriend|amigo / amiga\nfamily|familia\nneed|necesitar\nwant|querer\nunderstand|entender\nwait|esperar\nagain|otra vez\nslowly|despacio\nproblem|problema`,
  work: `manager|gerente\njob|trabajo / empleo\ntask|tarea\ntraining|entrenamiento\nuniform|uniforme\ntime clock|reloj de ponchar\nclock in|marcar entrada\nclock out|marcar salida\nlunch|almuerzo\navailable|disponible\nday off|día libre\nlate|tarde\nearly|temprano\npayroll|nómina\nwage|paga / salario por hora\nraise|aumento\nbenefits|beneficios\nvacation|vacaciones\nsick day|día por enfermedad\ndeadline|fecha límite\nteam|equipo\ncustomer|cliente\nreport|reporte\napproved|aprobado`,
  construction: `gloves|guantes\nboots|botas\nvest|chaleco\nscaffold|andamio\nlift|elevador / plataforma\ncrane|grúa\nhoist|polipasto\nload|carga\nweight|peso\ncable|cable\nwire|alambre / cable eléctrico\nbolt|perno\nnut|tuerca\nwrench|llave\ndrill|taladro\nmeasure|medir\nlevel|nivel\nfall|caída\nedge|borde\nhazard|peligro\ninspect|inspeccionar\nsecure|asegurar\nlower|bajar\nraise|subir / elevar`,
  medical: `doctor|doctor / doctora\nnurse|enfermero / enfermera\nhospital|hospital\nclinic|clínica\nsymptom|síntoma\nheadache|dolor de cabeza\ncough|tos\nbreathing|respiración\nblood|sangre\npressure|presión\nprescription|receta médica\ndose|dosis\ntablet|pastilla\ninjury|lesión\nstomach|estómago\nchest|pecho\nback|espalda\ndizzy|mareado\nnausea|náusea\nsurgery|cirugía\ntest|prueba\nresult|resultado\nhealthy|saludable\ncheckup|chequeo médico`,
  shopping: `discount|descuento\nsale|oferta\nchange|cambio\nrefund|reembolso\nexchange|cambio de producto\naisle|pasillo\ncart|carrito\ncheckout|caja / pago\nbag|bolsa\ncustomer service|servicio al cliente\nexpensive|caro\ncheap|barato\ntotal|total\ntax|impuesto\ncoupon|cupón\nbrand|marca\ncolor|color\nsmall|pequeño\nmedium|mediano\nlarge|grande\ntry on|probarse\nfitting room|probador\navailable|disponible\nstore|tienda`,
  restaurant: `breakfast|desayuno\nlunch|almuerzo\ndinner|cena\nserver|mesero / mesera\nkitchen|cocina\nplate|plato\nfork|tenedor\nspoon|cuchara\nknife|cuchillo\nnapkin|servilleta\nsalt|sal\nsugar|azúcar\nice|hielo\nchicken|pollo\nbeef|carne de res\nfish|pescado\nvegetarian|vegetariano\nallergy|alergia\nreservation|reservación\ntakeout|para llevar\ndelivery|entrega\ncook|cocinar\nready|listo\ndelicious|delicioso`,
  interview: `employer|empleador\ncompany|compañía\napplication|solicitud\nreference|referencia\neducation|educación\ncertification|certificación\nqualified|calificado\nresponsibility|responsabilidad\nteamwork|trabajo en equipo\nleadership|liderazgo\nreliable|confiable\nflexible|flexible\nfull-time|tiempo completo\npart-time|medio tiempo\nstart date|fecha de inicio\nbackground|experiencia / antecedentes\ngoal|meta\nachievement|logro\nchallenge|reto\nquestion|pregunta\nanswer|respuesta\nbenefit|beneficio\noffer|oferta\nopportunity|oportunidad`,
  school: `student|estudiante\nparent|padre / madre\noffice|oficina\nbus|autobús\nlunch|almuerzo\nrecess|recreo\ntest|prueba\nexam|examen\nproject|proyecto\nreport card|boleta de calificaciones\nattendance|asistencia\nlate|tarde\ncalendar|calendario\nmeeting|reunión\ncounselor|consejero\nnurse|enfermera\nlibrary|biblioteca\nbook|libro\nreading|lectura\nmath|matemáticas\nEnglish|inglés\nscience|ciencias\nfield trip|excursión escolar\nregistration|matrícula`
};

const parseExtraWords = (text = '') => text.split('\n').map((line) => {
  const [word, meaning] = line.split('|');
  return { word, meaning, example: '', exampleMeaning: '' };
}).filter((item) => item.word && item.meaning);

for (const course of COURSES) {
  course.words = [...course.words, ...parseExtraWords(EXTRA_WORDS[course.id] || '')].slice(0, WORDS_PER_LEVEL * 4);
}

const LEVEL_BLUEPRINTS = [
  { id: 'foundation', name: 'Base esencial', icon: 'foundation', focus: 'Reconoce y entiende', description: 'Construye una base rápida con vocabulario indispensable.' },
  { id: 'memory', name: 'Memoria activa', icon: 'memory', focus: 'Escucha y recuerda', description: 'Reduce las pistas y fortalece lo que ya reconoces.' },
  { id: 'production', name: 'Producción', icon: 'keyboard', focus: 'Escribe y construye', description: 'Recupera las palabras sin depender de opciones.' },
  { id: 'realworld', name: 'Uso real', icon: 'conversation', focus: 'Resuelve situaciones', description: 'Combina significado, escucha y contexto en retos mixtos.' }
];

const ICON_PATHS = {
  everyday: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M9 12v2h6v-2"/>',
  construction: '<path d="M4 18h16M6 18v-5a6 6 0 0 1 12 0v5M9 11V7h6v4M3 18v2h18v-2"/>',
  medical: '<path d="M12 21s-7-4.35-7-11a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 6.65-7 11-7 11Z"/><path d="M9 12h6M12 9v6"/>',
  shopping: '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  restaurant: '<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 2 4 5 4 8h-4"/>',
  interview: '<path d="M8 12l2.5 2.5L16 9"/><circle cx="12" cy="12" r="9"/><path d="M17 17l4 4"/>',
  school: '<path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 10v6"/>',
  foundation: '<path d="M4 19h16M6 19V9l6-5 6 5v10M9 19v-5h6v5"/>',
  memory: '<path d="M12 5a5 5 0 0 0-9 3c0 2 1 3 2 4-1 1-1 4 2 5 1 2 4 2 5 0 1 2 4 2 5 0 3-1 3-4 2-5 1-1 2-2 2-4a5 5 0 0 0-9-3Z"/><path d="M12 5v12"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 14h2M11 14h6"/>',
  conversation: '<path d="M4 5h11a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-2-3V8a3 3 0 0 1 2-3Z"/><path d="M8 9h6M8 12h4"/>',
  flame: '<path d="M13 2s1 4-2 6c-2 1-3-1-3-1s-3 3-3 7a7 7 0 0 0 14 0c0-5-3-8-6-12Z"/><path d="M12 13c-2 1-2 3-1 5"/>',
  spark: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 8a7 7 0 0 1 11-2l3 3M18 16a7 7 0 0 1-11 2l-3-3"/>',
  book: '<path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2V5Z"/><path d="M20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2V5Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
  bookmark: '<path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"/>'
};

function iconSvg(name, className = 'sb-line-icon') {
  const path = ICON_PATHS[name] || ICON_PATHS.book;
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const COURSE_ICON_ASSETS = Object.freeze({
  everyday: '/assets/learn/everyday.png',
  work: '/assets/learn/work.png',
  construction: '/assets/learn/construction.png',
  medical: '/assets/learn/medical.png',
  shopping: '/assets/learn/shopping.png',
  restaurant: '/assets/learn/restaurant.png',
  interview: '/assets/learn/interview.png',
  school: '/assets/learn/school.png'
});

function courseIconImage(name, className = 'course-icon-image') {
  const src = COURSE_ICON_ASSETS[name];
  return src ? `<img class="${className}" src="${src}" alt="" aria-hidden="true" loading="lazy" decoding="async">` : iconSvg(name, className);
}

const $ = (selector) => document.querySelector(selector);
const listen = (element, event, handler) => { if (element) element.addEventListener(event, handler); };
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const normalize = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
const wordKey = (courseId, word) => `${courseId}:${normalize(word)}`;
const levelKey = (courseId, levelId) => `${courseId}:${levelId}`;
const todayKey = () => { const now = new Date(); const year = now.getFullYear(); const month = String(now.getMonth() + 1).padStart(2, '0'); const day = String(now.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; };
const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy.toISOString(); };

function levelsForCourse(course) {
  return LEVEL_BLUEPRINTS.map((blueprint, index) => ({
    ...blueprint,
    number: index + 1,
    words: course.words.slice(index * WORDS_PER_LEVEL, (index + 1) * WORDS_PER_LEVEL)
  })).filter((level) => level.words.length);
}

function defaultState() {
  return {
    xp: 0,
    streak: 0,
    lastActivityDate: '',
    daily: { date: todayKey(), xp: 0 },
    progress: {},
    levelSessions: {},
    customWords: [],
    recentCourse: 'everyday',
    recentLevel: 'foundation'
  };
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LEARN_STATE_KEY) || '{}');
    const result = { ...defaultState(), ...saved };
    if (!result.daily || result.daily.date !== todayKey()) result.daily = { date: todayKey(), xp: 0 };
    if (!result.progress || typeof result.progress !== 'object') result.progress = {};
    if (!result.levelSessions || typeof result.levelSessions !== 'object') result.levelSessions = {};
    if (!Array.isArray(result.customWords)) result.customWords = [];
    return result;
  } catch {
    return defaultState();
  }
}

function saveState(state) { localStorage.setItem(LEARN_STATE_KEY, JSON.stringify(state)); window.SinBarrerasCloud?.queueSync?.(); }

function updateStreak(state) {
  const today = todayKey();
  if (state.lastActivityDate === today) return;
  if (!state.lastActivityDate) state.streak = 1;
  else {
    const previous = new Date(`${state.lastActivityDate}T12:00:00`);
    const current = new Date(`${today}T12:00:00`);
    const days = Math.round((current - previous) / 86_400_000);
    state.streak = days === 1 ? state.streak + 1 : 1;
  }
  state.lastActivityDate = today;
}

function masteryFor(state, courseId, word) { return state.progress[wordKey(courseId, word)]?.mastery || 0; }
function completedSessions(state, courseId, levelId) { return Math.min(SESSIONS_PER_LEVEL, state.levelSessions[levelKey(courseId, levelId)]?.completed || 0); }
function levelProgress(state, course, level) {
  const sessions = completedSessions(state, course.id, level.id);
  const avgMastery = level.words.length ? level.words.reduce((sum, word) => sum + masteryFor(state, course.id, word.word), 0) / level.words.length : 0;
  return Math.round((sessions / SESSIONS_PER_LEVEL) * 75 + avgMastery * .25);
}
function courseProgress(state, course) {
  const levels = levelsForCourse(course);
  if (!levels.length) return 0;
  return Math.round(levels.reduce((sum, level) => sum + levelProgress(state, course, level), 0) / levels.length);
}
function isLevelUnlocked(state, course, level) {
  if (level.number === 1) return true;
  const previous = levelsForCourse(course)[level.number - 2];
  return completedSessions(state, course.id, previous.id) >= SESSIONS_PER_LEVEL;
}

function dueWords(state) {
  const now = Date.now();
  const items = [];
  for (const course of COURSES) for (const word of course.words) {
    const progress = state.progress[wordKey(course.id, word.word)];
    if (progress?.nextReviewAt && new Date(progress.nextReviewAt).getTime() <= now) items.push({ ...word, courseId: course.id, courseTitle: course.title });
  }
  for (const word of state.customWords) {
    const progress = state.progress[wordKey('custom', word.word)];
    if (!progress || !progress.nextReviewAt || new Date(progress.nextReviewAt).getTime() <= now) items.push({ ...word, courseId: 'custom', courseTitle: 'Mis palabras' });
  }
  return items;
}

function buildChoices(correct, pool, accessor, count = 3) {
  const correctValue = accessor(correct);
  const others = pool.filter((item) => accessor(item) !== correctValue).sort(() => Math.random() - .5).slice(0, count - 1);
  return [correct, ...others].sort(() => Math.random() - .5);
}

const SESSION_PHASES = [
  { name: 'Explorar', types: ['meaning','reverse','meaning','listen','reverse','meaning','listen','example'] },
  { name: 'Reconocer', types: ['reverse','listen','meaning','example','reverse','type','listen','meaning'] },
  { name: 'Escuchar', types: ['listen','listen','reverse','type','example','type','listen','meaning'] },
  { name: 'Producir', types: ['type','example','reverse','listen','type','example','type','listen'] },
  { name: 'Checkpoint', types: ['meaning','listen','type','reverse','example','type','listen','example'] }
];

function makeExercises(course, level, selectedWords, sessionNumber = 1) {
  const pool = level?.words?.length ? level.words : course.words;
  const pattern = SESSION_PHASES[Math.min(SESSION_PHASES.length - 1, Math.max(0, sessionNumber - 1))].types;
  return selectedWords.slice(0, LESSON_SIZE).map((item, index) => {
    const type = pattern[index % pattern.length];
    if (type === 'meaning') return { type, word: item, title: `¿Qué significa “${item.word}”?`, choices: buildChoices(item, pool, (entry) => entry.meaning) };
    if (type === 'reverse') return { type, word: item, title: `¿Cuál palabra significa “${item.meaning}”?`, choices: buildChoices(item, pool, (entry) => entry.word) };
    if (type === 'listen') return { type, word: item, title: 'Escucha y selecciona la palabra', choices: buildChoices(item, pool, (entry) => entry.word) };
    if (type === 'type') return { type, word: item, title: `Escribe en inglés: “${item.meaning}”` };
    return { type: 'example', word: item, title: item.example ? 'Completa la frase' : `Recupera la palabra: “${item.meaning}”`, choices: buildChoices(item, pool, (entry) => entry.word) };
  });
}

function chooseWordsForLevel(state, course, level) {
  return [...level.words]
    .sort((a, b) => masteryFor(state, course.id, a.word) - masteryFor(state, course.id, b.word) || Math.random() - .5)
    .slice(0, LESSON_SIZE);
}

export function initLearning({ notify, speakText, request, createAutoVoiceTurn, getNativeLanguage, onNavigate } = {}) {
  const ui = {
    view: $('#learn-view'), xp: $('#learn-xp'), streak: $('#learn-streak'), dailyText: $('#learn-daily-text'), dailyBar: $('#learn-daily-bar'),
    continueTitle: $('#learn-continue-title'), continueMeta: $('#learn-continue-meta'), continueBar: $('#learn-continue-bar'), continueButton: $('#learn-continue-button'),
    reviewCard: $('#learn-review-card'), reviewCount: $('#learn-review-count'), reviewButton: $('#learn-review-button'), courseGrid: $('#learn-course-grid'),
    levelPanel: $('#learn-level-panel'), levelBack: $('#learn-level-back'), levelIcon: $('#learn-level-icon'), levelTitle: $('#learn-level-title'), levelMeta: $('#learn-level-meta'), levelProgress: $('#learn-level-progress'), levelGrid: $('#learn-level-grid'),
    mastered: $('#learn-mastered-count'), learning: $('#learn-learning-count'), customCount: $('#learn-custom-count'), wordsList: $('#learn-words-list'),
    player: $('#lesson-player'), close: $('#lesson-close'), playerBar: $('#lesson-progress-bar'), playerStep: $('#lesson-step'), courseLabel: $('#lesson-course-label'), focus: $('#lesson-focus'),
    badge: $('#lesson-badge'), title: $('#lesson-title'), prompt: $('#lesson-prompt'), options: $('#lesson-options'), listen: $('#lesson-listen'), voice: $('#lesson-voice'), inputWrap: $('#lesson-input-wrap'), input: $('#lesson-input'), check: $('#lesson-check'),
    feedback: $('#lesson-feedback'), feedbackIcon: $('#lesson-feedback-icon'), feedbackTitle: $('#lesson-feedback-title'), feedbackCopy: $('#lesson-feedback-copy'), continue: $('#lesson-continue'),
    complete: $('#lesson-complete'), completeXp: $('#lesson-complete-xp'), completeWords: $('#lesson-complete-words'), completeButton: $('#lesson-complete-button')
  };

  let state = readState();
  let session = null;
  let selectedCourseId = null;
  let lessonVoiceCapture = null;
  let lessonVoiceBusy = false;

  document.querySelectorAll('[data-learn-icon]').forEach((node) => { node.innerHTML = iconSvg(node.dataset.learnIcon); });

  function persist() { saveState(state); render(); }

  function renderWords() {
    if (!ui.wordsList) return;
    const learned = [];
    for (const course of COURSES) for (const word of course.words) {
      const progress = state.progress[wordKey(course.id, word.word)];
      if (progress?.attempts) learned.push({ ...word, courseId: course.id, courseTitle: course.title, courseIcon: course.id, mastery: progress.mastery || 0 });
    }
    for (const word of state.customWords) {
      const progress = state.progress[wordKey('custom', word.word)] || {};
      learned.push({ ...word, courseId: 'custom', courseTitle: 'De mis conversaciones', courseIcon: 'bookmark', mastery: progress.mastery || 0 });
    }
    learned.sort((a, b) => b.mastery - a.mastery);
    ui.wordsList.innerHTML = learned.length ? learned.slice(0, 12).map((item) => `
      <button class="learn-word-row" type="button" data-speak-word="${encodeURIComponent(item.word)}">
        <span class="learn-word-emoji">${iconSvg(item.courseIcon, 'sb-line-icon word-row-icon')}</span>
        <span><strong>${escapeHTML(item.word)}</strong><small>${escapeHTML(item.meaning)} · ${escapeHTML(item.courseTitle)}</small></span>
        <span class="mastery-ring" style="--mastery:${Math.max(5, item.mastery)}%"><b>${item.mastery}%</b></span>
      </button>`).join('') : `<div class="learn-empty"><span>${iconSvg('memory')}</span><strong>Tus palabras aparecerán aquí</strong><p>Completa un nivel o guarda vocabulario desde una traducción.</p></div>`;
  }

  function currentLevelFor(course) {
    const levels = levelsForCourse(course);
    const requested = levels.find((level) => level.id === state.recentLevel);
    if (requested && isLevelUnlocked(state, course, requested)) return requested;
    return levels.find((level) => completedSessions(state, course.id, level.id) < SESSIONS_PER_LEVEL && isLevelUnlocked(state, course, level)) || levels[levels.length - 1];
  }

  function renderLevelPanel(course) {
    if (!ui.levelPanel || !course) return;
    const levels = levelsForCourse(course);
    const progress = courseProgress(state, course);
    ui.levelPanel.classList.remove('is-hidden');
    if (ui.levelIcon) ui.levelIcon.innerHTML = courseIconImage(course.id, 'route-course-image');
    if (ui.levelTitle) ui.levelTitle.textContent = course.title;
    if (ui.levelMeta) ui.levelMeta.textContent = `${levels.length} niveles · ${levels.length * SESSIONS_PER_LEVEL} sesiones · ${course.words.length} palabras · ${levels.length * SESSIONS_PER_LEVEL * LESSON_SIZE} retos`;
    if (ui.levelProgress) ui.levelProgress.style.width = `${progress}%`;
    if (ui.levelGrid) ui.levelGrid.innerHTML = levels.map((level) => {
      const completed = completedSessions(state, course.id, level.id);
      const unlocked = isLevelUnlocked(state, course, level);
      const percent = levelProgress(state, course, level);
      const status = completed >= SESSIONS_PER_LEVEL ? 'Completado' : unlocked ? `Sesión ${completed + 1} de ${SESSIONS_PER_LEVEL}` : 'Bloqueado';
      const buttonLabel = completed >= SESSIONS_PER_LEVEL ? 'REPASAR NIVEL' : unlocked ? 'CONTINUAR NIVEL' : 'COMPLETA EL NIVEL ANTERIOR';
      return `<article class="level-card ${unlocked ? '' : 'is-locked'} ${completed >= SESSIONS_PER_LEVEL ? 'is-complete' : ''}">
        <div class="level-card-top">
          <span class="level-number">NIVEL ${String(level.number).padStart(2,'0')}</span>
          <span class="level-status-icon">${iconSvg(completed >= SESSIONS_PER_LEVEL ? 'check' : unlocked ? level.icon : 'lock')}</span>
        </div>
        <div class="level-icon-box">${iconSvg(level.icon, 'sb-line-icon level-main-icon')}</div>
        <h4>${escapeHTML(level.name)}</h4>
        <strong class="level-focus">${escapeHTML(level.focus)}</strong>
        <p>${escapeHTML(level.description)}</p>
        <div class="level-metrics"><span><b>${level.words.length}</b> palabras</span><span><b>${SESSIONS_PER_LEVEL}</b> sesiones</span><span><b>${SESSIONS_PER_LEVEL * LESSON_SIZE}</b> retos</span></div>
        <div class="level-word-preview">${level.words.slice(0,4).map((word) => `<span>${escapeHTML(word.word)}</span>`).join('')}<span>+${Math.max(0, level.words.length - 4)}</span></div>
        <div class="level-progress-row"><span>${status}</span><b>${percent}%</b></div>
        <div class="progress-track compact level-track"><i style="width:${percent}%"></i></div>
        <button class="level-start" type="button" data-level="${level.id}" data-course="${course.id}" data-locked="${unlocked ? '0' : '1'}">${buttonLabel}<span>${iconSvg(unlocked ? 'arrow' : 'lock')}</span></button>
      </article>`;
    }).join('');
  }

  function render() {
    state = readState();
    const todayXp = state.daily?.xp || 0;
    const mastered = Object.values(state.progress).filter((item) => (item.mastery || 0) >= 80).length;
    const learning = Object.values(state.progress).filter((item) => (item.attempts || 0) > 0 && (item.mastery || 0) < 80).length;
    if (ui.xp) ui.xp.textContent = state.xp.toLocaleString();
    if (ui.streak) ui.streak.textContent = state.streak;
    if (ui.dailyText) ui.dailyText.textContent = `${Math.min(todayXp, DAILY_XP_GOAL)} / ${DAILY_XP_GOAL} XP`;
    if (ui.dailyBar) ui.dailyBar.style.width = `${Math.min(100, (todayXp / DAILY_XP_GOAL) * 100)}%`;
    if (ui.mastered) ui.mastered.textContent = mastered;
    if (ui.learning) ui.learning.textContent = learning;
    if (ui.customCount) ui.customCount.textContent = state.customWords.length;

    const recent = COURSES.find((item) => item.id === state.recentCourse) || COURSES[0];
    const level = currentLevelFor(recent);
    const progress = courseProgress(state, recent);
    const done = completedSessions(state, recent.id, level.id);
    if (ui.continueTitle) ui.continueTitle.textContent = `${recent.title} · Nivel ${level.number}`;
    if (ui.continueMeta) ui.continueMeta.textContent = `${level.name} · ${done >= SESSIONS_PER_LEVEL ? 'repaso disponible' : `sesión ${done + 1}/${SESSIONS_PER_LEVEL}`}`;
    if (ui.continueBar) ui.continueBar.style.width = `${progress}%`;
    if (ui.continueButton) { ui.continueButton.dataset.course = recent.id; ui.continueButton.dataset.level = level.id; }

    const due = dueWords(state);
    ui.reviewCard?.classList.toggle('is-hidden', due.length === 0);
    if (ui.reviewCount) ui.reviewCount.textContent = `${due.length} ${due.length === 1 ? 'palabra lista' : 'palabras listas'} para repasar`;

    if (ui.courseGrid) {
      ui.courseGrid.innerHTML = COURSES.map((course, index) => {
        const percent = courseProgress(state, course);
        const levels = levelsForCourse(course);
        const current = currentLevelFor(course);
        const completedCount = levels.filter((item) => completedSessions(state, course.id, item.id) >= SESSIONS_PER_LEVEL).length;
        return `<button class="course-card" type="button" data-course="${course.id}">
          <span class="course-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="course-icon">${courseIconImage(course.id, 'course-icon-image')}</span>
          <span class="course-copy"><strong>${course.title}</strong><small>${course.subtitle}</small></span>
          <span class="course-meta-line"><b>${levels.length} niveles</b><span>${levels.length * SESSIONS_PER_LEVEL} sesiones</span><span>${course.words.length} palabras</span></span>
          <span class="course-progress"><i style="width:${percent}%"></i></span>
          <span class="course-footer"><b>${percent}%</b><span>${completedCount}/${levels.length} niveles · Nivel ${current.number} →</span></span>
        </button>`;
      }).join('');
    }
    if (selectedCourseId) renderLevelPanel(COURSES.find((item) => item.id === selectedCourseId));
    renderWords();
  }

  function showPlayer() { if (!ui.player) return; ui.player.classList.remove('is-hidden'); document.body.classList.add('lesson-open'); }
  function hidePlayer() { ui.player?.classList.add('is-hidden'); document.body.classList.remove('lesson-open'); session = null; }

  function startLesson(courseId, reviewItems = null, levelId = null) {
    const course = courseId === 'custom' ? { id: 'custom', title: 'Mis palabras', words: state.customWords } : COURSES.find((item) => item.id === courseId);
    if (!course || !course.words.length) { notify?.('Todavía no hay palabras en esta sección.'); return; }
    const level = course.id === 'custom'
      ? { id: 'custom', number: 1, name: 'Mis palabras', focus: 'Repaso personal', words: course.words }
      : levelsForCourse(course).find((item) => item.id === (levelId || state.recentLevel)) || currentLevelFor(course);
    if (course.id !== 'custom' && !isLevelUnlocked(state, course, level)) { notify?.('Completa el nivel anterior para abrir este nivel.'); return; }
    const completed = course.id === 'custom' ? 0 : completedSessions(state, course.id, level.id);
    const sessionNumber = Math.min(SESSIONS_PER_LEVEL, completed + 1);
    const words = reviewItems?.length ? reviewItems.slice(0, LESSON_SIZE) : chooseWordsForLevel(state, course, level);
    session = {
      course, level, sessionNumber,
      exercises: makeExercises(course, level, words, sessionNumber),
      index: 0, focus: 5, xp: 0, correct: 0, attempts: 0, mistakes: 0, answered: false, selectedValue: '', finished: false
    };
    if (course.id !== 'custom') { state.recentCourse = course.id; state.recentLevel = level.id; }
    saveState(state); showPlayer(); renderExercise();
  }

  function sentencePrompt(word) {
    const source = word.example || '';
    const regex = new RegExp(`\\b${String(word.word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return source && regex.test(source) ? source.replace(regex, '________') : `Recuerda la palabra en inglés para “${word.meaning}”.`;
  }

  function renderExercise() {
    if (!session) return;
    const exercise = session.exercises[session.index];
    if (!exercise) { finishLesson(); return; }
    session.answered = false; session.selectedValue = '';
    ui.complete?.classList.add('is-hidden'); ui.feedback?.classList.add('is-hidden');
    if (ui.playerStep) ui.playerStep.textContent = `${session.index + 1} / ${session.exercises.length}`;
    if (ui.playerBar) ui.playerBar.style.width = `${(session.index / session.exercises.length) * 100}%`;
    if (ui.focus) ui.focus.textContent = session.focus;
    if (ui.courseLabel) ui.courseLabel.textContent = `${session.course.title.toUpperCase()} · NIVEL ${session.level.number} · ${SESSION_PHASES[session.sessionNumber - 1]?.name?.toUpperCase() || 'REPASO'} ${session.sessionNumber}/${SESSIONS_PER_LEVEL}`;
    if (ui.badge) ui.badge.textContent = exercise.isRetry ? 'RECUPERA ESTA PALABRA' : ({ meaning: 'SIGNIFICADO', reverse: 'RECUERDO ACTIVO', listen: 'ESCUCHA', type: 'SIN PISTAS', example: 'CONTEXTO' }[exercise.type] || 'APRENDER');
    if (ui.title) ui.title.textContent = exercise.title;
    if (ui.prompt) {
      ui.prompt.textContent = exercise.type === 'example' ? sentencePrompt(exercise.word) : exercise.type === 'listen' ? 'Escucha una vez. Después elige lo que realmente oíste.' : '';
      ui.prompt.classList.toggle('is-hidden', !ui.prompt.textContent);
    }
    ui.listen?.classList.toggle('is-hidden', exercise.type !== 'listen');
    ui.voice?.classList.toggle('is-hidden', exercise.type === 'meaning' || session.answered);
    if (ui.voice && !lessonVoiceBusy) ui.voice.innerHTML = '<span>●</span><b>RESPONDER CON MI VOZ</b><small>Habla y la app detectará cuando termines</small>';
    ui.inputWrap?.classList.toggle('is-hidden', exercise.type !== 'type');
    if (ui.input) { ui.input.value = ''; ui.input.disabled = false; }
    if (ui.check) { ui.check.disabled = true; ui.check.textContent = 'CONFIRMAR RESPUESTA'; }

    if (ui.options) {
      const choiceMode = ['meaning','reverse','listen','example'].includes(exercise.type);
      ui.options.classList.toggle('is-hidden', !choiceMode);
      ui.options.innerHTML = choiceMode ? exercise.choices.map((choice, index) => {
        const label = exercise.type === 'meaning' ? choice.meaning : choice.word;
        return `<button class="lesson-option" type="button" data-answer="${encodeURIComponent(label)}"><span class="lesson-choice-art"><span class="choice-number">${String(index + 1).padStart(2,'0')}</span>${session.course.id === 'custom' ? iconSvg('bookmark', 'sb-line-icon choice-icon') : courseIconImage(session.course.id, 'lesson-course-image')}</span><strong>${escapeHTML(label)}</strong><kbd>${index + 1}</kbd></button>`;
      }).join('') : '';
    }
    if (exercise.type === 'listen') window.setTimeout(() => speakText?.(exercise.word.word, 'en').catch?.(() => {}), 180);
    if (exercise.type === 'type') window.setTimeout(() => ui.input?.focus(), 120);
  }

  function expectedValue(exercise) { return exercise.type === 'meaning' ? exercise.word.meaning : exercise.word.word; }
  function updateWordProgress(exercise, correct) {
    const key = wordKey(session.course.id, exercise.word.word);
    const current = state.progress[key] || { attempts: 0, correct: 0, mastery: 0 };
    current.attempts += 1; if (correct) current.correct += 1;
    current.mastery = Math.max(0, Math.min(100, (current.mastery || 0) + (correct ? 14 : -9)));
    current.lastPracticedAt = new Date().toISOString();
    const interval = correct ? current.mastery >= 85 ? 14 : current.mastery >= 70 ? 7 : current.mastery >= 50 ? 3 : 1 : 0;
    current.nextReviewAt = addDays(new Date(), interval); state.progress[key] = current;
  }

  function answer(value) {
    if (!session || session.answered) return;
    const exercise = session.exercises[session.index];
    const expected = expectedValue(exercise);
    const isCorrect = normalize(value) === normalize(expected);
    session.answered = true; session.selectedValue = value; session.attempts += 1;
    const earnedXp = exercise.isRetry ? 6 : 10;
    if (isCorrect) { session.correct += 1; session.xp += earnedXp; }
    else {
      session.focus = Math.max(0, session.focus - 1); session.mistakes += 1;
      if (!exercise.isRetry) {
        const retry = { ...exercise, isRetry: true, title: `Recupera “${exercise.word.word}” sin depender de la respuesta anterior` };
        const retryAt = Math.min(session.index + 3, session.exercises.length);
        session.exercises.splice(retryAt, 0, retry);
      }
    }
    updateWordProgress(exercise, isCorrect); updateStreak(state); navigator.vibrate?.(isCorrect ? 28 : [36,35,36]);
    if (state.daily.date !== todayKey()) state.daily = { date: todayKey(), xp: 0 };
    if (isCorrect) { state.xp += earnedXp; state.daily.xp += earnedXp; }
    saveState(state);
    if (ui.focus) ui.focus.textContent = session.focus;
    if (ui.playerBar) ui.playerBar.style.width = `${((session.index + 1) / session.exercises.length) * 100}%`;
    ui.options?.querySelectorAll('.lesson-option').forEach((button) => {
      const buttonValue = decodeURIComponent(button.dataset.answer || ''); button.disabled = true;
      button.classList.toggle('is-correct', normalize(buttonValue) === normalize(expected));
      button.classList.toggle('is-wrong', !isCorrect && normalize(buttonValue) === normalize(value));
    });
    if (ui.input) ui.input.disabled = true; if (ui.check) ui.check.disabled = true;
    ui.voice?.classList.add('is-hidden');
    if (ui.feedback) { ui.feedback.classList.remove('is-hidden','is-wrong'); ui.feedback.classList.toggle('is-wrong', !isCorrect); }
    if (ui.feedbackIcon) ui.feedbackIcon.innerHTML = iconSvg(isCorrect ? 'check' : 'refresh', 'sb-line-icon feedback-svg');
    if (ui.feedbackTitle) ui.feedbackTitle.textContent = isCorrect ? (exercise.isRetry ? 'Ahora sí. Esta palabra ya quedó más fuerte.' : 'Bien. Ya conectaste significado y uso.') : 'Todavía no. La reforzamos en unos pasos.';
    if (ui.feedbackCopy) ui.feedbackCopy.innerHTML = isCorrect
      ? `<strong>${escapeHTML(exercise.word.word)}</strong> · ${escapeHTML(exercise.word.meaning)}${exercise.word.example ? `<br><span>${escapeHTML(exercise.word.example)}</span>` : ''}`
      : `La respuesta correcta es <strong>${escapeHTML(expected)}</strong>. Volverá más adelante para ayudarte a fijarla.`;
    guidedScroll(ui.feedback, { block: 'end', delay: 60 });
    ui.continue?.focus({ preventScroll: true });
  }

  function continueLesson() { if (!session?.answered) return; if (session.index >= session.exercises.length - 1) { finishLesson(); return; } session.index += 1; renderExercise(); }

  function finishLesson() {
    if (!session) return;
    if (!session.finished && session.course.id !== 'custom') {
      const key = levelKey(session.course.id, session.level.id);
      const current = state.levelSessions[key] || { completed: 0 };
      if (current.completed < SESSIONS_PER_LEVEL) current.completed += 1;
      current.lastCompletedAt = new Date().toISOString(); state.levelSessions[key] = current; session.finished = true;
      const levels = levelsForCourse(session.course);
      const next = levels[session.level.number];
      if (current.completed >= SESSIONS_PER_LEVEL && next) notify?.(`Nivel ${session.level.number} completado. Se abrió Nivel ${next.number}: ${next.name}.`);
      saveState(state);
    }
    if (ui.playerBar) ui.playerBar.style.width = '100%';
    $('.lesson-question')?.classList.add('is-hidden'); ui.feedback?.classList.add('is-hidden'); ui.complete?.classList.remove('is-hidden');
    guidedTop(ui.complete, { force: true, delay: 50 });
    if (ui.completeXp) ui.completeXp.textContent = `+${session.xp} XP`;
    if (ui.completeWords) ui.completeWords.textContent = `${session.attempts ? Math.round((session.correct / session.attempts) * 100) : 0}%`;
    persist();
  }

  function resetQuestionVisibility() { $('.lesson-question')?.classList.remove('is-hidden'); }

  async function importFromEnglishText(englishText, situation = 'everyday') {
    const text = String(englishText || '').trim(); if (!text) return 0;
    const result = await request('/api/learn/extract', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ englishText:text, situation }) });
    const words = Array.isArray(result.words) ? result.words : []; let added = 0;
    for (const item of words) {
      const word = String(item.word || '').trim(), meaning = String(item.meaning || '').trim();
      if (!word || !meaning || state.customWords.some((saved) => normalize(saved.word) === normalize(word))) continue;
      state.customWords.unshift({ word, meaning, example:String(item.example || '').trim(), exampleMeaning:String(item.exampleMeaning || '').trim() }); added += 1;
    }
    state.customWords = state.customWords.slice(0,100); saveState(state); render(); return added;
  }

  async function answerWithVoice() {
    if (!session || session.answered || lessonVoiceBusy || !createAutoVoiceTurn) return;
    const exercise = session.exercises[session.index];
    if (!exercise || exercise.type === 'meaning') return;
    try {
      lessonVoiceBusy = true;
      ui.voice?.classList.add('recording');
      const capture = await createAutoVoiceTurn({
        onState: (mode) => {
          if (!ui.voice) return;
          if (mode === 'waiting') ui.voice.innerHTML = '<span>●</span><b>HABLA CUANDO ESTÉS LISTO</b><small>No tienes que presionar Stop</small>';
          if (mode === 'listening') ui.voice.innerHTML = '<span>●</span><b>TE ESCUCHO…</b><small>Termina la palabra o frase y haz una pausa</small>';
          if (mode === 'thinking') ui.voice.innerHTML = '<span>◌</span><b>PAUSA NATURAL</b><small>Espero un momento por si continúas</small>';
          if (mode === 'processing') ui.voice.innerHTML = '<span>✓</span><b>ENTENDIDO</b><small>Revisando tu respuesta…</small>';
        }
      });
      lessonVoiceCapture = capture;
      const audio = await capture.promise;
      lessonVoiceCapture = null;
      const form = new FormData();
      form.append('audio', audio, 'lesson-answer.webm');
      form.append('targetText', exercise.word.word);
      form.append('originalIntent', exercise.word.meaning || '');
      form.append('nativeLanguage', getNativeLanguage?.() || 'es');
      const result = await request('/api/practice/score', { method:'POST', body:form });
      const heard = String(result.heardText || '').trim();
      if (!heard) throw new Error('No pude reconocer tu respuesta. Intenta otra vez.');
      answer(heard);
    } catch (error) {
      if (error?.name !== 'AbortError') notify?.(error.message || 'No pudimos revisar tu respuesta por voz.');
    } finally {
      lessonVoiceCapture = null;
      lessonVoiceBusy = false;
      ui.voice?.classList.remove('recording');
      if (ui.voice && !session?.answered) ui.voice.innerHTML = '<span>●</span><b>RESPONDER CON MI VOZ</b><small>Habla y la app detectará cuando termines</small>';
    }
  }

  listen(ui.continueButton, 'click', () => { resetQuestionVisibility(); startLesson(ui.continueButton.dataset.course || state.recentCourse, null, ui.continueButton.dataset.level || state.recentLevel); });
  listen(ui.reviewButton, 'click', () => {
    const due = dueWords(state); if (!due.length) { notify?.('No tienes palabras pendientes por repasar.'); return; }
    const firstCourse = due[0].courseId; resetQuestionVisibility(); startLesson(firstCourse, due.filter((item) => item.courseId === firstCourse));
  });
  listen(ui.courseGrid, 'click', (event) => {
    const button = event.target.closest('[data-course]'); if (!button) return;
    selectedCourseId = button.dataset.course; renderLevelPanel(COURSES.find((item) => item.id === selectedCourseId));
    guidedTop(ui.levelPanel, { delay: 60 });
  });
  listen(ui.levelBack, 'click', () => { selectedCourseId = null; ui.levelPanel?.classList.add('is-hidden'); guidedTop(ui.courseGrid, { delay: 60 }); });
  listen(ui.levelGrid, 'click', (event) => {
    const button = event.target.closest('[data-level]'); if (!button) return;
    if (button.dataset.locked === '1') { notify?.('Completa las 5 sesiones del nivel anterior para desbloquear este nivel.'); return; }
    resetQuestionVisibility(); startLesson(button.dataset.course, null, button.dataset.level);
  });
  listen(ui.wordsList, 'click', async (event) => { const button = event.target.closest('[data-speak-word]'); if (!button) return; try { await speakText?.(decodeURIComponent(button.dataset.speakWord), 'en'); } catch (error) { notify?.(error.message); } });
  listen(ui.close, 'click', () => { lessonVoiceCapture?.cancel?.(); lessonVoiceCapture = null; lessonVoiceBusy = false; hidePlayer(); });
  listen(ui.voice, 'click', answerWithVoice);
  listen(ui.listen, 'click', async () => { const exercise = session?.exercises?.[session.index]; if (!exercise) return; try { await speakText?.(exercise.word.word, 'en'); } catch (error) { notify?.(error.message); } });
  listen(ui.options, 'click', (event) => { const button = event.target.closest('[data-answer]'); if (!button || session?.answered) return; ui.options.querySelectorAll('.lesson-option').forEach((item) => item.classList.remove('is-selected')); button.classList.add('is-selected'); session.selectedValue = decodeURIComponent(button.dataset.answer || ''); if (ui.check) ui.check.disabled = false; });
  listen(ui.input, 'input', () => { if (ui.check) ui.check.disabled = !ui.input.value.trim(); });
  listen(ui.input, 'keydown', (event) => { if (event.key === 'Enter' && !ui.check?.disabled) { event.preventDefault(); ui.check.click(); } });
  listen(ui.check, 'click', () => { const exercise = session?.exercises?.[session.index]; if (!exercise) return; answer(exercise.type === 'type' ? ui.input.value : session.selectedValue); });
  listen(ui.continue, 'click', continueLesson);
  listen(ui.completeButton, 'click', () => { hidePlayer(); resetQuestionVisibility(); render(); onNavigate?.('learn'); });
  window.addEventListener('keydown', (event) => {
    if (!session || ui.player?.classList.contains('is-hidden')) return;
    if (['1','2','3'].includes(event.key) && !session.answered && !ui.options?.classList.contains('is-hidden')) ui.options.querySelectorAll('.lesson-option')[Number(event.key)-1]?.click();
  });

  render();
  return { render, startLesson, importFromEnglishText };
}
