// Every de line, by area. Keys are the English lines.
import type { Dict } from './index';
import { account } from './de/account';
import { core } from './de/core';
import { people } from './de/people';
import { play } from './de/play';

export const de: Dict = { ...core, ...play, ...account, ...people };
