// The help articles in German: the same slugs, groups and order as articles.ts, and the same numbers from the code.

import { EARNED, howTo } from '../avatar/earned';
import { FIRST_GAP, gapAt, LEVELS_PER_RANK, RANKS } from '../engine/level';
import { MAKE } from '../engine/make';
import { BOND_AT, HINT_OF, PARTNER_POINTS, PARTNERS } from '../engine/partners';
import { REST_EARN, REST_WINDOW } from '../engine/rest';
import { FIND_POINTS, TIME_BONUS, TIP_OFF_COST } from '../engine/score';
import { DEEP_JOINS, LONG_WORD } from '../engine/skill';
import { GOALS } from '../lib/goal';
import { LEAGUE_TIERS, LEAGUE_UP } from '../lib/league';
import { OUTFIT_NEEDS } from '../lib/petOutfit';
import { CLEAN_BONUS, RARE_BONUS } from '../lib/profileStats';
import type { HelpArticle } from './types';

const n = (x: number) => x.toLocaleString('de');
const list = (xs: readonly string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} und ${xs.at(-1)}`);
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const rankStart = (i: number) => Array.from({ length: i * LEVELS_PER_RANK }, (_, k) => gapAt(k + 1)).reduce((a, b) => a + b, 0);

const PICKS: Record<string, string> = { first: 'das erste Wort in Leserichtung', longest: 'das längste Wort', near: 'das Wort, das deinem letzten Fund am nächsten ist', shortest: 'das kürzeste Wort' };
const GOAL_NAMES: Record<string, string> = { Light: 'Leicht', Regular: 'Normal', Serious: 'Ernsthaft' };
const LEAGUE_TABLE = 20;
const LEAGUE_DOWN_FROM = 5;

export const HELP_ARTICLES_DE: readonly HelpArticle[] = [
  {
    slug: 'how-to-play',
    group: 'Playing',
    title: 'Wie spielt man?',
    answer: 'Lies den Absatz und zieh über die Buchstaben eines versteckten Worts. Wörter laufen über Leerzeichen und Satzzeichen hinweg: „Pat omitted“ versteckt ATOM.',
    steps: [
      'Öffne Rätsel und tipp auf das nächste.',
      'Lies den Absatz langsam.',
      'Zieh über die Buchstaben eines Worts. Auf dem Handy wischen, oder den ersten und dann den letzten Buchstaben antippen.',
      'Finde jedes Wort, oder drück Fertig, wenn du alles gefunden hast, was du kannst.',
    ],
    related: ['tip-offs', 'stars'],
  },
  {
    slug: 'tip-offs',
    group: 'Playing',
    title: 'Was ist ein Tipp?',
    answer: `Dein Haustier markiert den ersten Buchstaben eines Worts, das du noch nicht gefunden hast, in jedem Spiel außer Lügner, wo er die Lüge verraten würde. Jeder Tipp kostet ${TIP_OFF_COST} Punkte.`,
    facts: PARTNERS.map((p) => `${p.name} wählt ${PICKS[HINT_OF[p.id]]}.`),
    related: ['pets', 'points'],
  },
  {
    slug: 'number-puzzles',
    group: 'Playing',
    title: 'Wie funktionieren die Zahlenrätsel?',
    answer: 'Zieh über Ziffern in einer Reihe, die zusammen das Ziel ergeben. Eine Ziffer zu viel oder zu wenig ist knapp daneben und kostet nichts.',
    related: ['how-to-play'],
  },
  {
    slug: 'mirror-puzzles',
    group: 'Playing',
    title: 'Warum lesen sich manche Wörter rückwärts?',
    answer: 'Bei einem Spiegelrätsel lesen sich die versteckten Wörter von rechts nach links. Zieh von einem der beiden Enden darüber.',
    related: ['how-to-play'],
  },
  {
    slug: 'liar-puzzles',
    group: 'Playing',
    title: 'Wie spielt man Lügner?',
    answer: 'Die Aussagen kommen einzeln: Wisch eine Lüge nach links und eine Wahrheit nach rechts, oder drück Lüge oder Wahr. 1 oder 2 der 5 sind falsch, und eine wahre Aussage Lüge zu nennen ist ein Fehlgriff.',
    related: ['how-to-play'],
  },
  {
    slug: 'relay-puzzles',
    group: 'Playing',
    title: 'Was ist eine Wortkette?',
    answer: 'Eine Kette sind 3 oder mehr versteckte Wörter hintereinander, jedes beginnt mit dem letzten Buchstaben des vorigen. Zieh über die ganze Kette; ein Glied zu viel oder zu wenig ist knapp daneben.',
    related: ['how-to-play'],
  },
  {
    slug: 'series-puzzles',
    group: 'Playing',
    title: 'Was ist eine gleichmäßige Reihe?',
    answer: '3 oder mehr Ziffern hintereinander, die jedes Mal um gleich viel steigen oder fallen: 1 3 5 7 steigt um 2, 9 6 3 fällt um 3. Zieh über die ganze Reihe; eine Ziffer zu viel oder zu wenig ist knapp daneben.',
    related: ['how-to-play'],
  },
  {
    slug: 'groups-puzzles',
    group: 'Playing',
    title: 'Wie spielt man Vierergruppen?',
    answer: 'Die 16 Bilder sind 4 Gruppen zu je 4: Tipp 4 an, die zusammengehören, und prüf sie. Eine richtige Gruppe rastet mit ihrem Namen ein, und 3 von 4 ist „eins daneben“: kostet keinen Stern, aber 1 deiner 4 Versuche.',
    related: ['how-to-play'],
  },
  {
    slug: 'stars',
    group: 'Playing',
    title: 'Wie bekomme ich 3 Sterne?',
    answer: 'Finde jedes Wort ohne Tipp und ohne Fehlgriff. Deine besten Sterne bei jedem Rätsel bleiben gespeichert.',
    facts: ['3 Sterne: jedes Wort, kein Tipp, kein Fehlgriff.', '2 Sterne: mindestens 8 von 10 Wörtern.', '1 Stern: mindestens die Hälfte der Wörter.', 'Weniger als die Hälfte: keine Sterne, und das Rätsel bleibt offen für einen neuen Versuch.'],
    related: ['tip-offs', 'points'],
  },
  {
    slug: 'leaving-a-puzzle',
    group: 'Playing',
    title: 'Was passiert, wenn ich ein Rätsel mittendrin verlasse?',
    answer: 'Es bleibt in diesem Browser gespeichert und geht dort weiter, wo du aufgehört hast, mit den gefundenen Wörtern. Die Uhr steht, solange du weg bist.',
  },
  {
    slug: 'packs',
    group: 'Packs and progress',
    title: 'Was ist ein Paket?',
    answer: 'Eine Reihe kurzer Rätsel, die der Reihe nach gespielt werden. Schließ eins ab, und das nächste öffnet sich.',
    related: ['how-to-play', 'daily-goal'],
  },
  {
    slug: 'runs-and-rest-days',
    group: 'Packs and progress',
    title: 'Was hält meine Serie am Leben?',
    answer: `Schließ jeden Tag ein Rätsel ab. Verpasst du einen einzelnen Tag, nachdem du an ${REST_EARN} der ${REST_WINDOW} Tage davor gespielt hast, ist dieser Tag ein Ruhetag: Deine Serie läuft weiter.`,
    facts: [`Höchstens 1 Ruhetag in ${REST_WINDOW} Tagen.`, 'Ein Ruhetag hält die Serie am Leben, verlängert sie aber nicht.', 'Serien mit Freunden folgen derselben Regel.'],
    related: ['daily-goal'],
  },
  {
    slug: 'daily-goal',
    group: 'Packs and progress',
    title: 'Wie funktioniert das Tagesziel?',
    answer: 'Wähl, wie viele Rätsel du am Tag spielen willst, und der Ring bei Du füllt sich, während du sie abschließt. Es zu verpassen kostet nichts.',
    facts: GOALS.map((g) => `${GOAL_NAMES[g.name] ?? g.name}: ${g.n} ${g.n === 1 ? 'Rätsel' : 'Rätsel'} am Tag.`),
    steps: ['Öffne Du.', 'Wähl unter Heute Leicht, Normal oder Ernsthaft.'],
  },
  {
    slug: 'playing-as-a-guest',
    group: 'Packs and progress',
    title: 'Brauche ich ein Konto?',
    answer: 'Nein, du kannst jedes Rätsel als Gast auf diesem Gerät spielen. Wenn du dich anmeldest (ab 13 Jahren), bleiben deine Sterne, deine Serie und deine Punkte auf jedem Gerät.',
    related: ['signing-in'],
  },
  {
    slug: 'points',
    group: 'Points, ranks and leagues',
    title: 'Wie werden Punkte gezählt?',
    answer: `Jedes gefundene Wort ist ${FIND_POINTS} Punkte wert, und jeder Tipp kostet ${TIP_OFF_COST}. Punkte zählen ein Leben lang und sinken nie.`,
    facts: [
      `Finde jedes Wort und bekomm bis zu ${n(TIME_BONUS)} dazu: ${n(TIME_BONUS)} minus die Sekunden, die du gebraucht hast.`,
      `Sauber gelesen, jedes Wort ohne Tipp und ohne Fehlgriff, bringt ${CLEAN_BONUS} einmal pro Rätsel.`,
      `Ein seltenes Wort, das weniger als 1 von 10 Spielern gefunden hat, bringt ${RARE_BONUS} einmal pro Wort.`,
      'Spielst du ein Rätsel noch einmal, zählt nur dein bestes Ergebnis.',
    ],
    related: ['ranks', 'leagues'],
  },
  {
    slug: 'ranks',
    group: 'Points, ranks and leagues',
    title: 'Welche Ränge gibt es?',
    answer: `Dein Rang ergibt sich aus deinen Punkten insgesamt, ${LEVELS_PER_RANK} Stufen pro Rang. Stufe 2 beginnt bei ${n(FIRST_GAP)} Punkten.`,
    facts: RANKS.map((r, i) => `${r}: ab ${n(rankStart(i))} Punkten.`),
    related: ['points'],
  },
  {
    slug: 'leagues',
    group: 'Points, ranks and leagues',
    title: 'Wie funktionieren Ligen?',
    answer: `Jede Woche spielst du in einer Tabelle mit bis zu ${LEAGUE_TABLE} Spielern, geordnet nach den Punkten aus Rätseln, die du zum ersten Mal abschließt. Am Ende der Woche steigen die besten ${LEAGUE_UP} eine Liga auf.`,
    facts: [
      `Die Ligen: ${list(LEAGUE_TIERS)}.`,
      'Eine Woche beginnt am Montag um 00:00 UTC.',
      `Die letzten 5 steigen ab, aber nie in einer Tabelle mit weniger als ${LEAGUE_DOWN_FROM}.`,
      'Ein Rätsel noch einmal zu spielen bringt keine Ligapunkte.',
      'Du kannst unter Liga austreten und jederzeit wieder beitreten.',
    ],
    related: ['points'],
  },
  {
    slug: 'medals',
    group: 'Points, ranks and leagues',
    title: 'Wie verdiene ich Medaillen?',
    answer: 'Medaillen kommen davon, wie du spielst: sauber gelesen, ein langes Wort, ein seltener Fund, deine Serie und deine Punkte. Jede hat Stufen, geprägt in einem neuen Metall.',
    facts: [
      'Sauber gelesen: jedes Wort, kein Tipp, kein Fehlgriff.',
      'Perfekt ohne Tipp: jedes Wort, kein Tipp.',
      `Langes Wort: ein Wort mit ${LONG_WORD} Buchstaben oder mehr.`,
      `Tiefer Fund: ein Wort über ${DEEP_JOINS} Lücken oder mehr.`,
      'Seltener Blick: ein Wort, das weniger als 1 von 10 Spielern gefunden hat.',
    ],
    related: ['points'],
  },
  {
    slug: 'pets',
    group: 'Your pet and your look',
    title: 'Wie bekomme ich ein anderes Haustier?',
    answer: `${PARTNERS[0]!.name} ist kostenlos. Die anderen öffnen sich, wenn deine Punkte wachsen, und Punkte werden nie ausgegeben.`,
    facts: [
      ...PARTNERS.slice(1).map((p, i) => `${p.name}: ${n(PARTNER_POINTS[i + 1]!)} Punkte.`),
      `Schließ ${BOND_AT[0]} Pakete mit einem Haustier ab, und es trägt seine Lupe. Bei ${BOND_AT[1]} auch sein Monokel.`,
    ],
    steps: ['Öffne Du.', 'Tipp unter Haustiere eins an, um es auszuprobieren, und wähl es dann.'],
    related: ['tip-offs', 'pet-outfits'],
  },
  {
    slug: 'pet-outfits',
    group: 'Your pet and your look',
    title: 'Wie ziehe ich mein Haustier an?',
    answer: 'Öffne Du und tipp unter Outfits auf eins. Ein Outfit, das du noch nicht verdient hast, zeigt, was es braucht.',
    facts: Object.entries(OUTFIT_NEEDS).map(([o, need]) => `${cap(o)}: ${howTo(need)}`),
    related: ['pets'],
  },
  {
    slug: 'your-look',
    group: 'Your pet and your look',
    title: 'Wie ändere ich mein Aussehen?',
    answer: 'Öffne Du und tipp auf den Stift an deinem Bild. Fast alles ist kostenlos, ein paar Dinge verdienst du dir.',
    facts: EARNED.map((e) => `${cap(e.name)}: ${howTo(e.need)}`),
  },
  {
    slug: 'play-together',
    group: 'Friends',
    title: 'Wie spiele ich mit Freunden?',
    answer: 'Öffne ein ganzes Rätsel, drück Zusammen spielen und schick den Link. Alle suchen gleichzeitig auf demselben Brett.',
    steps: ['Öffne ein Rätsel aus einem Paket.', 'Drück Zusammen spielen.', 'Schick den Link an deine Freunde.'],
    related: ['friend-streaks'],
  },
  {
    slug: 'friend-streaks',
    group: 'Friends',
    title: 'Was ist eine Serie mit Freunden?',
    answer: 'Eine Serie, die du mit einem Freund hältst: Sie wächst an jedem Tag, an dem ihr beide ein Rätsel abschließt. Starte sie unter Leute oder auf seiner Seite.',
    related: ['runs-and-rest-days'],
  },
  {
    slug: 'make-a-puzzle',
    group: 'Making puzzles',
    title: 'Wie erstelle ich ein Rätsel?',
    answer: 'Öffne Erstellen und gib ein Thema, ein Emoji oder einen eigenen Absatz ein. Prüf den Entwurf, ändere, was du willst, veröffentliche es und schick den Link.',
    steps: [
      'Öffne Erstellen, unten bei Rätsel.',
      'Gib ein Thema ein, oder lass das Feld leer und drück Überrasch mich.',
      'Ändere im Entwurf den Titel, die Wörter oder das Symbol.',
      'Drück Rätsel veröffentlichen.',
    ],
    facts: [
      `Ein Rätsel versteckt ${MAKE.minWords} bis ${MAKE.maxWords} Wörter in ${MAKE.minText} bis ${MAKE.maxText} Buchstaben.`,
      `Bis zu ${MAKE.perHour} Entwürfe und Rätsel pro Stunde.`,
      'Nur für angemeldete Spieler.',
    ],
    related: ['made-by-players'],
  },
  {
    slug: 'made-by-players',
    group: 'Making puzzles',
    title: 'Wo sind die Rätsel anderer Spieler?',
    answer: 'Unter Von Spielern, verlinkt unten bei Rätsel. Die beliebtesten stehen oben.',
    related: ['make-a-puzzle'],
  },
  {
    slug: 'signing-in',
    group: 'Your account',
    title: 'Wie melde ich mich an?',
    answer: 'Drück Anmelden, gib deine E-Mail ein und dann den Code, den wir dir schicken. Es gibt kein Passwort.',
    related: ['playing-as-a-guest'],
  },
  {
    slug: 'download-my-data',
    group: 'Your account',
    title: 'Wie bekomme ich eine Kopie meiner Daten?',
    answer: 'Öffne Einstellungen und drück Meine Daten herunterladen. Alles, was wir über dich speichern, kommt in 1 Datei.',
    related: ['delete-my-account'],
  },
  {
    slug: 'delete-my-account',
    group: 'Your account',
    title: 'Wie lösche ich mein Konto?',
    answer: 'Öffne Einstellungen und drück ganz unten Konto löschen. Dein Profil und deine Spiele werden sofort entfernt, und das lässt sich nicht rückgängig machen.',
    related: ['download-my-data'],
  },
];

export const HELP_GROUP_DE: Record<string, string> = {
  Playing: 'Spielen',
  'Packs and progress': 'Pakete und Fortschritt',
  'Points, ranks and leagues': 'Punkte, Ränge und Ligen',
  'Your pet and your look': 'Dein Haustier und dein Aussehen',
  Friends: 'Freunde',
  'Making puzzles': 'Rätsel erstellen',
  'Your account': 'Dein Konto',
};
