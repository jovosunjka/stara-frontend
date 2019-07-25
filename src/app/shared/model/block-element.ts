import { Element } from './element';
import { RunLevel } from './enum/run-level.enum';

export interface BlockElement extends Element {
    section?: string;
    runLevel: RunLevel;
    assets?: string[];
}
