import { BlockElement } from './block-element';

export interface Process extends BlockElement {
    sanitizeInput: boolean;
    sanitizeOutput: boolean;
    hasForgeryProtection: boolean;
    sessionHasTimeouts: boolean;
    requiresAuthentication: boolean;
    requiresAuthorization: boolean;
    idOfDiagram?: string; // ovo ima samo complex-process
}
