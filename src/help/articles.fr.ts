// The help articles in French: the same slugs, groups and order as articles.ts, and the same numbers from the code.

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

const n = (x: number) => x.toLocaleString('fr');
const list = (xs: readonly string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs.at(-1)}`);
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const rankStart = (i: number) => Array.from({ length: i * LEVELS_PER_RANK }, (_, k) => gapAt(k + 1)).reduce((a, b) => a + b, 0);

const PICKS: Record<string, string> = { first: 'le premier mot dans l’ordre de lecture', longest: 'le mot le plus long', near: 'le mot le plus proche de ta dernière trouvaille', shortest: 'le mot le plus court' };
const GOAL_NAMES: Record<string, string> = { Light: 'Léger', Regular: 'Normal', Serious: 'Sérieux' };
const LEAGUE_TABLE = 20;
const LEAGUE_DOWN_FROM = 5;

export const HELP_ARTICLES_FR: readonly HelpArticle[] = [
  {
    slug: 'how-to-play',
    group: 'Playing',
    title: 'Comment on joue ?',
    answer: 'Lis le paragraphe et fais glisser ton doigt sur les lettres d’un mot caché. Les mots passent par-dessus les espaces et la ponctuation : « Pat omitted » cache ATOM.',
    steps: [
      'Ouvre Puzzles et touche le suivant.',
      'Lis le paragraphe lentement.',
      'Fais glisser sur les lettres d’un mot. Sur un téléphone, balaie, ou touche la première lettre puis la dernière.',
      'Trouve tous les mots, ou appuie sur J’ai fini quand tu as trouvé tout ce que tu pouvais.',
    ],
    related: ['tip-offs', 'stars'],
  },
  {
    slug: 'tip-offs',
    group: 'Playing',
    title: 'C’est quoi, un indice ?',
    answer: `Ton compagnon marque la première lettre d’un mot que tu n’as pas encore trouvé. Chaque indice coûte ${TIP_OFF_COST} points.`,
    facts: PARTNERS.map((p) => `${p.name} choisit ${PICKS[HINT_OF[p.id]]}.`),
    related: ['pets', 'points'],
  },
  {
    slug: 'number-puzzles',
    group: 'Playing',
    title: 'Comment marchent les puzzles de chiffres ?',
    answer: 'Fais glisser sur des chiffres qui se suivent et dont la somme fait la cible. Un chiffre de trop ou de moins, c’est presque : ça ne coûte rien.',
    related: ['how-to-play'],
  },
  {
    slug: 'mirror-puzzles',
    group: 'Playing',
    title: 'Pourquoi certains mots se lisent à l’envers ?',
    answer: 'Dans un puzzle miroir, les mots se lisent de droite à gauche. Fais glisser depuis l’un ou l’autre bout.',
    related: ['how-to-play'],
  },
  {
    slug: 'liar-puzzles',
    group: 'Playing',
    title: 'Comment on joue à Menteur ?',
    answer: 'Les phrases arrivent une par une : glisse un mensonge à gauche et une vérité à droite, ou appuie sur Mensonge ou Vrai. 1 ou 2 des 5 sont fausses, et traiter une vraie de mensonge est une erreur.',
    related: ['how-to-play'],
  },
  {
    slug: 'relay-puzzles',
    group: 'Playing',
    title: 'C’est quoi, une chaîne de mots ?',
    answer: 'Une chaîne, ce sont 3 mots cachés ou plus qui se suivent, chacun commençant sur la dernière lettre du précédent. Fais glisser sur toute la chaîne ; un maillon de trop ou de moins, c’est presque.',
    related: ['how-to-play'],
  },
  {
    slug: 'series-puzzles',
    group: 'Playing',
    title: 'C’est quoi, une suite régulière ?',
    answer: '3 chiffres ou plus qui se suivent et montent ou descendent toujours du même écart : 1 3 5 7 monte de 2, 9 6 3 descend de 3. Fais glisser sur toute la suite ; un chiffre de trop ou de moins, c’est presque.',
    related: ['how-to-play'],
  },
  {
    slug: 'groups-puzzles',
    group: 'Playing',
    title: 'Comment on joue aux groupes de 4 ?',
    answer: 'Les 16 images forment 4 groupes de 4 : touche-en 4 qui vont ensemble, puis vérifie. Un bon groupe se fixe avec son nom, et 3 sur 4, c’est « à un près », jamais une erreur.',
    related: ['how-to-play'],
  },
  {
    slug: 'stars',
    group: 'Playing',
    title: 'Comment avoir 3 étoiles ?',
    answer: 'Trouve tous les mots sans indice et sans erreur. Ton meilleur résultat sur chaque puzzle est gardé.',
    facts: ['3 étoiles : tous les mots, sans indice, sans erreur.', '2 étoiles : au moins 8 mots sur 10.', '1 étoile : au moins la moitié des mots.', 'Moins de la moitié : pas d’étoile, et le puzzle reste ouvert pour réessayer.'],
    related: ['tip-offs', 'points'],
  },
  {
    slug: 'leaving-a-puzzle',
    group: 'Playing',
    title: 'Que se passe-t-il si je quitte un puzzle en cours ?',
    answer: 'Il est gardé dans ce navigateur et reprend où tu t’étais arrêté, avec les mots trouvés. Le chrono s’arrête pendant ton absence.',
  },
  {
    slug: 'packs',
    group: 'Packs and progress',
    title: 'C’est quoi, un paquet ?',
    answer: 'Une suite de petits puzzles à jouer dans l’ordre. Finis-en un et le suivant s’ouvre.',
    related: ['how-to-play', 'daily-goal'],
  },
  {
    slug: 'runs-and-rest-days',
    group: 'Packs and progress',
    title: 'Qu’est-ce qui fait durer ma série ?',
    answer: `Finis un puzzle chaque jour. Si tu rates un seul jour après avoir joué ${REST_EARN} des ${REST_WINDOW} jours d’avant, ce jour est un jour de repos : ta série continue.`,
    facts: [`Au plus 1 jour de repos sur ${REST_WINDOW} jours.`, 'Un jour de repos garde la série en vie mais ne l’allonge pas.', 'Les séries entre amis suivent la même règle.'],
    related: ['daily-goal'],
  },
  {
    slug: 'daily-goal',
    group: 'Packs and progress',
    title: 'Comment marche l’objectif du jour ?',
    answer: 'Choisis combien de puzzles tu veux jouer par jour, et l’anneau de Toi se remplit à mesure que tu les finis. Le manquer ne coûte rien.',
    facts: GOALS.map((g) => `${GOAL_NAMES[g.name] ?? g.name} : ${g.n} ${g.n === 1 ? 'puzzle' : 'puzzles'} par jour.`),
    steps: ['Ouvre Toi.', 'Sous Aujourd’hui, choisis Léger, Normal ou Sérieux.'],
  },
  {
    slug: 'playing-as-a-guest',
    group: 'Packs and progress',
    title: 'Faut-il un compte ?',
    answer: `Non. En invité, tu joues ${GUEST_GAMES} puzzles, puis tu te connectes pour continuer. Connecté, tes étoiles, ta série et tes points te suivent sur tous tes appareils.`,
    related: ['signing-in'],
  },
  {
    slug: 'points',
    group: 'Points, ranks and leagues',
    title: 'Comment sont comptés les points ?',
    answer: `Chaque mot trouvé vaut ${FIND_POINTS} points, et chaque indice en coûte ${TIP_OFF_COST}. Les points s’additionnent pour toujours et ne baissent jamais.`,
    facts: [
      `Trouve tous les mots et gagne jusqu’à ${n(TIME_BONUS)} de plus : ${n(TIME_BONUS)} moins les secondes que tu as mises.`,
      `Une lecture nette, tous les mots sans indice ni erreur, ajoute ${CLEAN_BONUS} une fois par puzzle.`,
      `Un mot rare, trouvé par moins d’1 joueur sur 10, ajoute ${RARE_BONUS} une fois par mot.`,
      'Rejouer un puzzle ne compte que ton meilleur score.',
    ],
    related: ['ranks', 'leagues'],
  },
  {
    slug: 'ranks',
    group: 'Points, ranks and leagues',
    title: 'Quels sont les rangs ?',
    answer: `Ton rang vient de tes points de toujours, ${LEVELS_PER_RANK} niveaux par rang. Le niveau 2 commence à ${n(FIRST_GAP)} points.`,
    facts: RANKS.map((r, i) => `${r} : à partir de ${n(rankStart(i))} points.`),
    related: ['points'],
  },
  {
    slug: 'leagues',
    group: 'Points, ranks and leagues',
    title: 'Comment marchent les ligues ?',
    answer: `Chaque semaine, tu joues dans un tableau de ${LEAGUE_TABLE} joueurs au plus, classés selon les points des puzzles finis pour la première fois. À la fin de la semaine, les ${LEAGUE_UP} premiers montent d’une division.`,
    facts: [
      `Les divisions : ${list(LEAGUE_TIERS)}.`,
      'Une semaine commence le lundi à 00:00 UTC.',
      `Les 5 derniers descendent d’une division, mais jamais dans un tableau de moins de ${LEAGUE_DOWN_FROM}.`,
      'Rejouer un puzzle ne rapporte aucun point de ligue.',
      'Tu peux quitter la ligue depuis Ta ligue, et revenir quand tu veux.',
    ],
    related: ['points'],
  },
  {
    slug: 'medals',
    group: 'Points, ranks and leagues',
    title: 'Comment gagner des médailles ?',
    answer: 'Les médailles viennent de ta façon de jouer : une lecture nette, un mot long, une trouvaille rare, ta série et tes points. Chacune a des paliers, frappés dans un nouveau métal.',
    facts: [
      'Lecture nette : tous les mots, sans indice, sans erreur.',
      'Parfait sans indice : tous les mots, sans indice.',
      `Mot long : un mot de ${LONG_WORD} lettres ou plus.`,
      `Trouvaille profonde : un mot qui traverse ${DEEP_JOINS} espaces ou plus.`,
      'Œil rare : un mot trouvé par moins d’1 joueur sur 10.',
    ],
    related: ['points'],
  },
  {
    slug: 'pets',
    group: 'Your pet and your look',
    title: 'Comment avoir un autre compagnon ?',
    answer: `${PARTNERS[0]!.name} est gratuit. Les autres s’ouvrent à mesure que tes points grandissent, et les points ne se dépensent jamais.`,
    facts: [
      ...PARTNERS.slice(1).map((p, i) => `${p.name} : ${n(PARTNER_POINTS[i + 1]!)} points.`),
      `Finis ${BOND_AT[0]} paquets avec un compagnon et il porte une écharpe. À ${BOND_AT[1]}, une broche dorée en plus.`,
    ],
    steps: ['Ouvre Toi.', 'Sous Compagnons, touche-en un pour l’essayer, puis choisis-le.'],
    related: ['tip-offs', 'pet-outfits'],
  },
  {
    slug: 'pet-outfits',
    group: 'Your pet and your look',
    title: 'Comment habiller mon compagnon ?',
    answer: 'Ouvre Toi et touche une tenue sous Tenues. Une tenue pas encore gagnée montre ce qu’il faut faire.',
    facts: Object.entries(OUTFIT_NEEDS).map(([o, need]) => `${cap(o)} : ${howTo(need)}`),
    related: ['pets'],
  },
  {
    slug: 'your-look',
    group: 'Your pet and your look',
    title: 'Comment changer mon apparence ?',
    answer: 'Ouvre Toi et touche le crayon sur ton portrait. Presque tout est gratuit, et quelques choix se gagnent.',
    facts: EARNED.map((e) => `${cap(e.name)} : ${howTo(e.need)}`),
  },
  {
    slug: 'play-together',
    group: 'Friends',
    title: 'Comment jouer avec des amis ?',
    answer: 'Ouvre un puzzle entier, appuie sur Jouer ensemble et envoie le lien. Tout le monde cherche sur le même plateau en même temps.',
    steps: ['Ouvre un puzzle d’un paquet.', 'Appuie sur Jouer ensemble.', 'Envoie le lien à tes amis.'],
    related: ['friend-streaks'],
  },
  {
    slug: 'friend-streaks',
    group: 'Friends',
    title: 'C’est quoi, une série entre amis ?',
    answer: 'Une série que tu tiens avec un ami : elle grandit chaque jour où vous finissez tous les deux un puzzle. Lance-la depuis Tes amis ou depuis sa page.',
    related: ['runs-and-rest-days'],
  },
  {
    slug: 'make-a-puzzle',
    group: 'Making puzzles',
    title: 'Comment créer un puzzle ?',
    answer: 'Ouvre Créer et tape un sujet, un emoji ou un paragraphe à toi. Relis le brouillon, change ce que tu veux, puis publie-le et envoie le lien.',
    steps: [
      'Ouvre Créer, en bas de Puzzles.',
      'Tape un sujet, ou laisse la case vide et appuie sur Surprends-moi.',
      'Change le titre, les mots ou l’icône dans le brouillon.',
      'Appuie sur Publier le puzzle.',
    ],
    facts: [
      `Un puzzle cache de ${MAKE.minWords} à ${MAKE.maxWords} mots dans ${MAKE.minText} à ${MAKE.maxText} lettres.`,
      `Jusqu’à ${MAKE.perHour} brouillons et puzzles par heure.`,
      'Réservé aux joueurs connectés.',
    ],
    related: ['made-by-players'],
  },
  {
    slug: 'made-by-players',
    group: 'Making puzzles',
    title: 'Où sont les puzzles créés par les autres joueurs ?',
    answer: 'Dans Créés par les joueurs, en bas de Puzzles. Les plus aimés viennent en premier.',
    related: ['make-a-puzzle'],
  },
  {
    slug: 'signing-in',
    group: 'Your account',
    title: 'Comment me connecter ?',
    answer: 'Appuie sur Se connecter et entre ton e-mail, puis le code qu’on t’envoie. Il n’y a pas de mot de passe.',
    related: ['playing-as-a-guest'],
  },
  {
    slug: 'download-my-data',
    group: 'Your account',
    title: 'Comment avoir une copie de mes données ?',
    answer: 'Ouvre Réglages et appuie sur Télécharger mes données. Tout ce qu’on garde sur toi est enregistré dans 1 fichier.',
    related: ['delete-my-account'],
  },
  {
    slug: 'delete-my-account',
    group: 'Your account',
    title: 'Comment supprimer mon compte ?',
    answer: 'Ouvre Réglages et appuie sur Supprimer le compte, tout en bas. Ton profil et tes parties sont effacés tout de suite, et c’est définitif.',
    related: ['download-my-data'],
  },
];

export const HELP_GROUP_FR: Record<string, string> = {
  Playing: 'Jouer',
  'Packs and progress': 'Paquets et progression',
  'Points, ranks and leagues': 'Points, rangs et ligues',
  'Your pet and your look': 'Ton compagnon et ton apparence',
  Friends: 'Amis',
  'Making puzzles': 'Créer des puzzles',
  'Your account': 'Ton compte',
};
