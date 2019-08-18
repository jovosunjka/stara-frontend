import { Point } from './point';
import { Stencil } from './stencil';

export interface GraphicElement {
    id: string;
    stencilId: string;
    position?: Point;
    idOfData: string;
    idOfDiagram?: string;
}
