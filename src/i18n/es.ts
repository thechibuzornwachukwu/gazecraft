// Every Spanish line, by area. Keys are the English lines.
import { account } from './es/account';
import { core } from './es/core';
import { people } from './es/people';
import { play } from './es/play';

export const es = { ...core, ...play, ...account, ...people };
