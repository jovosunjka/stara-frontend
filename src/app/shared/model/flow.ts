import { Element } from './element';

export interface Flow extends Element {
    source?: string;
    destination?: string;
    containsCookies: boolean;
    containsXML: boolean;
    boundariesCrossed?: string[];
    assets?: string[];
}
