import { BlockElement } from './block-element';

export interface ExternalEntity extends BlockElement {
    sanitizeInput: boolean;
    sanitizeOutput: boolean;
    isThreadSafe: boolean;
}
