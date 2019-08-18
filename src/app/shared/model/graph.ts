import { GraphicElement } from './graphic-element';
import { Link } from './link';
import { TrustBoundary } from './trust-boundary';

export interface Graph {
    nodes: GraphicElement [];
    links: Link[];
    boundaries: TrustBoundary[];
    sections: GraphicElement[]; // za sada neka stoji ovaj tip (GraphicElement)
    translateX: number;
    translateY: number;
    scale: number;
}
