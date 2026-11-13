// The landing demo's sentence in each language.

/**
 * The demo in each language: a sentence with 5 words hidden, each with the topic it teases, and the puzzle the
 * warm up leads to. Checked by src/routes/landingDemo.test.ts.
 */
export const DEMOS = {
  en: {
    text: 'This line is a most ordinary sentence. Pat omitted nothing. Linda talked for ages, Pedro mentioned very little, and a big old clock kept the time.',
    words: [
      { word: 'Atom', lead: 'Science' },
      { word: 'Data', lead: 'AI' },
      { word: 'Rome', lead: 'History' },
      { word: 'Gold', lead: 'General' },
      { word: 'Amos', lead: 'Bible' },
    ],
    next: 'nigeria',
  },
  es: {
    text: 'Papá todavía lee el periódico. Saca ramas del jardín, busca otro mapa, y Natali marca el camino. Mamá limpia la mesa.',
    words: [
      { word: 'Pato', lead: 'Animales' },
      { word: 'Cara', lead: 'Cuerpo' },
      { word: 'Roma', lead: 'Ciudades' },
      { word: 'Lima', lead: 'Frutas' },
      { word: 'Malí', lead: 'Países' },
    ],
    next: 'es-animales',
  },
  fr: {
    text: "Le dimanche, papa, on se promène. Il ira tôt au parc, s'assoit sur un joli banc au coin de la rue, puis rentre à la maison.",
    words: [
      { word: 'Paon', lead: 'Animaux' },
      { word: 'Rat', lead: 'Animaux' },
      { word: 'Liban', lead: 'Pays' },
      { word: 'Inde', lead: 'Pays' },
      { word: 'Lama', lead: 'Animaux' },
    ],
    next: 'fr-animaux',
  },
  de: {
    text: 'Ich habe selten so gut gegessen. Oma als Köchin bringt einen Teller Suppe. Ihre Hand ist warm. Ach, und der Kuchen kommt noch.',
    words: [
      { word: 'Esel', lead: 'Tiere' },
      { word: 'Aal', lead: 'Tiere' },
      { word: 'Ente', lead: 'Tiere' },
      { word: 'Reh', lead: 'Tiere' },
      { word: 'Hund', lead: 'Tiere' },
    ],
    next: 'de-tiere',
  },
} as const;
