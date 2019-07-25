import { BlockElement } from './block-element';
import { Flow } from './flow';
import { Base } from './base';

export interface DataFlowDiagram {
    id: string;
    name: string;
    elements: BlockElement [];
    flows: Flow[];
    boundaries: Base[];
    sections: Base[];
}
