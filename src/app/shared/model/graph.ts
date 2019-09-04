import { GraphicElement } from './graphic-element';
import { Link } from './link';
import { TrustBoundaryGraphicElement } from './trust-boundary-graphic-element';

export interface Graph {
    nodes: GraphicElement [];
    links: Link[];
    boundaries: TrustBoundaryGraphicElement[];
    sections: GraphicElement[]; // za sada neka stoji ovaj tip (GraphicElement)
    translateX: number;
    translateY: number;
    scale: number;
}
