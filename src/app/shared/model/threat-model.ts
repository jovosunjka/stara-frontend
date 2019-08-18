import { DataFlowDiagram } from './data-flow-diagram';

export interface ThreatModel {
    id: string;
    name: string;
    diagrams: DataFlowDiagram[];
}
