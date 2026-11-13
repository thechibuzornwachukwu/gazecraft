// Every fr line, by area. Keys are the English lines.
import type { Dict } from './index';
import { account } from './fr/account';
import { core } from './fr/core';
import { people } from './fr/people';
import { play } from './fr/play';

export const fr: Dict = { ...core, ...play, ...account, ...people };
