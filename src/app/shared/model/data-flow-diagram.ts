import { Flow } from './flow';
import { Base } from './base';
import { Graph } from './graph';
import { Process } from './process';
import { DataStore } from './data-store';
import { ExternalEntity } from './external-entity';
import { TrustBoundary } from './trust-boundary';


export interface DataFlowDiagram {
    id: string;
    name: string;
    graph?: Graph;
    elements: (Process | DataStore | ExternalEntity)[]; // BlockElement [];
    flows: Flow[];
    boundaries: TrustBoundary[];
    sections: Base[]; // za sada neka stoji ovaj tip (Base)
    complexProcess: boolean;
}
