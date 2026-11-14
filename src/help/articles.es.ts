// The help articles in Spanish: the same slugs, groups and order as articles.ts, and the same numbers from the code.

import { EARNED, howTo } from '../avatar/earned';
import { FIRST_GAP, gapAt, LEVELS_PER_RANK, RANKS } from '../engine/level';
import { MAKE } from '../engine/make';
import { BOND_AT, HINT_OF, PARTNER_POINTS, PARTNERS } from '../engine/partners';
import { REST_EARN, REST_WINDOW } from '../engine/rest';
import { FIND_POINTS, TIME_BONUS, TIP_OFF_COST } from '../engine/score';
import { DEEP_JOINS, LONG_WORD } from '../engine/skill';
import { GOALS } from '../lib/goal';
import { GUEST_GAMES } from '../lib/guestLimit';
import { LEAGUE_TIERS, LEAGUE_UP } from '../lib/league';
import { OUTFIT_NEEDS } from '../lib/petOutfit';
import { CLEAN_BONUS, RARE_BONUS } from '../lib/profileStats';
import type { HelpArticle } from './types';

const n = (x: number) => x.toLocaleString('es');
const list = (xs: readonly string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const rankStart = (i: number) => Array.from({ length: i * LEVELS_PER_RANK }, (_, k) => gapAt(k + 1)).reduce((a, b) => a + b, 0);

const PICKS: Record<string, string> = { first: 'la primera palabra en orden de lectura', longest: 'la palabra más larga', near: 'la palabra más cercana a tu último hallazgo', shortest: 'la palabra más corta' };
const GOAL_NAMES: Record<string, string> = { Light: 'Ligero', Regular: 'Normal', Serious: 'En serio' };

const LEAGUE_TABLE = 20;
const LEAGUE_DOWN_FROM = 5;

export const HELP_ARTICLES_ES: readonly HelpArticle[] = [
  {
    slug: 'how-to-play',
    group: 'Playing',
    title: '¿Cómo se juega?',
    answer: 'Lee el párrafo y arrastra por las letras de una palabra escondida. Las palabras cruzan espacios y signos: en "Pat omitted" se esconde ATOM.',
    steps: [
      'Abre Puzles y toca el siguiente.',
      'Lee el párrafo despacio.',
      'Arrastra por las letras de una palabra. En el teléfono, desliza, o toca la primera letra y luego la última.',
      'Encuentra todas las palabras, o pulsa Terminé cuando hayas encontrado todas las que puedas.',
    ],
    related: ['tip-offs', 'stars'],
  },
  {
    slug: 'tip-offs',
    group: 'Playing',
    title: '¿Qué es una pista?',
    answer: `Tu mascota marca la primera letra de una palabra que aún no encontraste. Cada pista cuesta ${TIP_OFF_COST} puntos.`,
    facts: PARTNERS.map((p) => `${p.name} elige ${PICKS[HINT_OF[p.id]]}.`),
    related: ['pets', 'points'],
  },
  {
    slug: 'number-puzzles',
    group: 'Playing',
    title: '¿Cómo funcionan los puzles de números?',
    answer: 'Arrastra por dígitos seguidos que sumen el objetivo. Quedarte corto o pasarte por un dígito es un casi y no cuesta nada.',
    related: ['how-to-play'],
  },
  {
    slug: 'mirror-puzzles',
    group: 'Playing',
    title: '¿Por qué algunas palabras se leen al revés?',
    answer: 'En un puzle espejo las palabras se leen de derecha a izquierda. Arrastra por una desde cualquiera de sus extremos.',
    related: ['how-to-play'],
  },
  {
    slug: 'liar-puzzles',
    group: 'Playing',
    title: '¿Cómo se juega a Mentiroso?',
    answer: 'Las frases llegan de una en una: desliza una mentira a la izquierda y una verdad a la derecha, o pulsa Mentira o Verdad. 1 o 2 de las 5 son falsas, y llamar mentira a una verdadera es un error.',
    related: ['how-to-play'],
  },
  {
    slug: 'relay-puzzles',
    group: 'Playing',
    title: '¿Qué es una cadena de palabras?',
    answer: 'Una cadena son 3 o más palabras escondidas seguidas, cada una empieza en la última letra de la anterior. Arrastra por toda la cadena; un eslabón de más o de menos es un casi.',
    related: ['how-to-play'],
  },
  {
    slug: 'series-puzzles',
    group: 'Playing',
    title: '¿Qué es una serie que sube o baja igual?',
    answer: '3 o más dígitos seguidos que suben o bajan lo mismo cada vez: 1 3 5 7 sube de 2 en 2, 9 6 3 baja de 3 en 3. Arrastra por toda la serie; un dígito de más o de menos es un casi.',
    related: ['how-to-play'],
  },
  {
    slug: 'groups-puzzles',
    group: 'Playing',
    title: '¿Cómo se juega a grupos de 4?',
    answer: 'Las 16 imágenes son 4 grupos de 4: toca 4 que vayan juntas y compruébalas. Un grupo correcto se fija con su nombre, y 3 de 4 es "a una", que nunca cuenta como error.',
    related: ['how-to-play'],
  },
  {
    slug: 'stars',
    group: 'Playing',
    title: '¿Cómo consigo 3 estrellas?',
    answer: 'Encuentra todas las palabras sin pistas y sin errores. Se guarda tu mejor resultado en cada puzle.',
    facts: ['3 estrellas: todas las palabras, sin pistas, sin errores.', '2 estrellas: al menos 8 de cada 10 palabras.', '1 estrella: al menos la mitad de las palabras.', 'Menos de la mitad: sin estrellas, y el puzle sigue abierto para intentarlo otra vez.'],
    related: ['tip-offs', 'points'],
  },
  {
    slug: 'leaving-a-puzzle',
    group: 'Playing',
    title: '¿Qué pasa si dejo un puzle a medias?',
    answer: 'Se guarda en este navegador y sigue donde lo dejaste, con las palabras que encontraste. El reloj se detiene mientras no estás.',
  },

  {
    slug: 'packs',
    group: 'Packs and progress',
    title: '¿Qué es un paquete?',
    answer: 'Un grupo de puzles cortos que se juegan en orden. Termina uno y se abre el siguiente.',
    related: ['how-to-play', 'daily-goal'],
  },
  {
    slug: 'runs-and-rest-days',
    group: 'Packs and progress',
    title: '¿Qué mantiene mi racha?',
    answer: `Termina un puzle cada día. Si faltas un solo día después de jugar ${REST_EARN} de los ${REST_WINDOW} días anteriores, ese día es de descanso y tu racha sigue.`,
    facts: [`Como mucho 1 día de descanso cada ${REST_WINDOW} días.`, 'Un día de descanso mantiene la racha pero no la aumenta.', 'Las rachas con amigos siguen la misma regla.'],
    related: ['daily-goal'],
  },
  {
    slug: 'daily-goal',
    group: 'Packs and progress',
    title: '¿Cómo funciona la meta diaria?',
    answer: 'Elige cuántos puzles quieres jugar al día, y el anillo de Tú se llena a medida que los terminas. No cumplirla no cuesta nada.',
    facts: GOALS.map((g) => `${GOAL_NAMES[g.name] ?? g.name}: ${g.n} ${g.n === 1 ? 'puzle' : 'puzles'} al día.`),
    steps: ['Abre Tú.', 'En Hoy, elige Ligero, Normal o En serio.'],
  },
  {
    slug: 'playing-as-a-guest',
    group: 'Packs and progress',
    title: '¿Necesito una cuenta?',
    answer: `No. Como invitado juegas ${GUEST_GAMES} puzles y luego inicias sesión para seguir. Con sesión iniciada, tus estrellas, racha y puntos te acompañan en cualquier dispositivo.`,
    related: ['signing-in'],
  },

  {
    slug: 'points',
    group: 'Points, ranks and leagues',
    title: '¿Cómo se cuentan los puntos?',
    answer: `Cada palabra que encuentras vale ${FIND_POINTS} puntos, y cada pista cuesta ${TIP_OFF_COST}. Los puntos se suman para siempre y nunca bajan.`,
    facts: [
      `Encuentra todas las palabras y suma hasta ${n(TIME_BONUS)} más: ${n(TIME_BONUS)} menos los segundos que tardaste.`,
      `Una lectura limpia, todas las palabras sin pistas ni errores, suma ${CLEAN_BONUS} una vez por puzle.`,
      `Una palabra rara, que encontró menos de 1 de cada 10 jugadores, suma ${RARE_BONUS} una vez por palabra.`,
      'Si repites un puzle, solo cuenta tu mejor resultado.',
    ],
    related: ['ranks', 'leagues'],
  },
  {
    slug: 'ranks',
    group: 'Points, ranks and leagues',
    title: '¿Cuáles son los rangos?',
    answer: `Tu rango sale de tus puntos de toda la vida, ${LEVELS_PER_RANK} niveles por rango. El nivel 2 empieza en ${n(FIRST_GAP)} puntos.`,
    facts: RANKS.map((r, i) => `${r}: desde ${n(rankStart(i))} puntos.`),
    related: ['points'],
  },
  {
    slug: 'leagues',
    group: 'Points, ranks and leagues',
    title: '¿Cómo funcionan las ligas?',
    answer: `Cada semana juegas en una tabla de hasta ${LEAGUE_TABLE} jugadores, ordenada por los puntos de los puzles que terminas por primera vez. Al acabar la semana, los ${LEAGUE_UP} primeros suben de división.`,
    facts: [
      `Las divisiones: ${list(LEAGUE_TIERS)}.`,
      'La semana empieza el lunes a las 00:00 UTC.',
      `Los 5 últimos bajan de división, pero nunca en una tabla de menos de ${LEAGUE_DOWN_FROM}.`,
      'Repetir un puzle no da puntos de liga.',
      'Puedes salir desde Liga y volver a entrar cuando quieras.',
    ],
    related: ['points'],
  },
  {
    slug: 'medals',
    group: 'Points, ranks and leagues',
    title: '¿Cómo gano medallas?',
    answer: 'Las medallas salen de cómo juegas: una lectura limpia, una palabra larga, un hallazgo raro, tu racha y tus puntos. Cada una tiene niveles, acuñados en un metal nuevo.',
    facts: [
      'Lectura limpia: todas las palabras, sin pistas, sin errores.',
      'Perfecto sin pistas: todas las palabras, sin pistas.',
      `Palabra larga: una palabra de ${LONG_WORD} letras o más.`,
      `Hallazgo profundo: una palabra que cruza ${DEEP_JOINS} espacios o más.`,
      'Ojo raro: una palabra que encontró menos de 1 de cada 10 jugadores.',
    ],
    related: ['points'],
  },

  {
    slug: 'pets',
    group: 'Your pet and your look',
    title: '¿Cómo consigo otra mascota?',
    answer: `${PARTNERS[0]!.name} es gratis. Las demás se abren a medida que crecen tus puntos de toda la vida, y los puntos nunca se gastan.`,
    facts: [
      ...PARTNERS.slice(1).map((p, i) => `${p.name}: ${n(PARTNER_POINTS[i + 1]!)} puntos.`),
      `Termina ${BOND_AT[0]} paquetes con una mascota y lleva bufanda. Con ${BOND_AT[1]}, también un broche dorado.`,
    ],
    steps: ['Abre Tú.', 'En Mascotas, toca una para probarla y luego elígela.'],
    related: ['tip-offs', 'pet-outfits'],
  },
  {
    slug: 'pet-outfits',
    group: 'Your pet and your look',
    title: '¿Cómo visto a mi mascota?',
    answer: 'Abre Tú y toca un conjunto en Conjuntos. Uno que aún no ganaste muestra qué hace falta.',
    facts: Object.entries(OUTFIT_NEEDS).map(([o, need]) => `${cap(o)}: ${howTo(need)}`),
    related: ['pets'],
  },
  {
    slug: 'your-look',
    group: 'Your pet and your look',
    title: '¿Cómo cambio mi aspecto?',
    answer: 'Abre Tú y toca el lápiz sobre tu imagen. Casi todo es gratis, y algunas cosas se ganan.',
    facts: EARNED.map((e) => `${cap(e.name)}: ${howTo(e.need)}`),
  },

  {
    slug: 'play-together',
    group: 'Friends',
    title: '¿Cómo juego con amigos?',
    answer: 'Abre un puzle completo, pulsa Jugar juntos y envía el enlace. Todos buscan palabras en el mismo tablero a la vez.',
    steps: ['Abre un puzle de un paquete.', 'Pulsa Jugar juntos.', 'Envía el enlace a tus amigos.'],
    related: ['friend-streaks'],
  },
  {
    slug: 'friend-streaks',
    group: 'Friends',
    title: '¿Qué es una racha con un amigo?',
    answer: 'Una racha que llevas con un amigo: crece cada día que los dos terminan un puzle. Empieza una desde Gente o desde su página.',
    related: ['runs-and-rest-days'],
  },

  {
    slug: 'make-a-puzzle',
    group: 'Making puzzles',
    title: '¿Cómo hago un puzle?',
    answer: 'Abre Crear y escribe un tema, un emoji o un párrafo tuyo. Revisa el borrador, cambia lo que quieras, publícalo y envía el enlace.',
    steps: [
      'Abre Crear, al pie de Puzles.',
      'Escribe un tema, o deja la caja vacía y pulsa Sorpréndeme.',
      'Cambia el título, las palabras o el icono en el borrador.',
      'Pulsa Publicar puzle.',
    ],
    facts: [
      `Un puzle esconde de ${MAKE.minWords} a ${MAKE.maxWords} palabras en ${MAKE.minText} a ${MAKE.maxText} letras.`,
      `Hasta ${MAKE.perHour} borradores y puzles por hora.`,
      'Solo para jugadores con sesión iniciada.',
    ],
    related: ['made-by-players'],
  },
  {
    slug: 'made-by-players',
    group: 'Making puzzles',
    title: '¿Dónde están los puzles que hicieron otros jugadores?',
    answer: 'En Hechos por jugadores, enlazado al pie de Puzles. Los que más gustan salen primero.',
    related: ['make-a-puzzle'],
  },

  {
    slug: 'signing-in',
    group: 'Your account',
    title: '¿Cómo inicio sesión?',
    answer: 'Pulsa Iniciar sesión y escribe tu correo, luego el código que te enviamos. No hay contraseña.',
    related: ['playing-as-a-guest'],
  },
  {
    slug: 'download-my-data',
    group: 'Your account',
    title: '¿Cómo consigo una copia de mis datos?',
    answer: 'Abre Ajustes y pulsa Descargar mis datos. Todo lo que guardamos sobre ti se descarga en 1 archivo.',
    related: ['delete-my-account'],
  },
  {
    slug: 'delete-my-account',
    group: 'Your account',
    title: '¿Cómo borro mi cuenta?',
    answer: 'Abre Ajustes y pulsa Borrar cuenta, al final. Elimina tu perfil y tus partidas al instante, y no se puede deshacer.',
    related: ['download-my-data'],
  },
];

/** Each help group's name in Spanish. */
export const HELP_GROUP_ES: Record<string, string> = {
  Playing: 'Cómo jugar',
  'Packs and progress': 'Paquetes y progreso',
  'Points, ranks and leagues': 'Puntos, rangos y ligas',
  'Your pet and your look': 'Tu mascota y tu aspecto',
  Friends: 'Amigos',
  'Making puzzles': 'Crear puzles',
  'Your account': 'Tu cuenta',
};
