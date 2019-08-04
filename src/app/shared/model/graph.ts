import { GraphicElement } from './graphic-element';
import { Link } from './link';

export interface Graph {
    nodes: GraphicElement [];
    links: Link[];
    boundaries: GraphicElement[]; // za sada neka stoji ovaj tip (GraphicElement)
    sections: GraphicElement[]; // za sada neka stoji ovaj tip (GraphicElement)
    translateX: number;
    translateY: number;
    scale: number;
}
