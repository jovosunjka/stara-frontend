import { GraphicElement } from './graphic-element';
import { Point } from './point';

export interface Link extends GraphicElement {
    points: Point[];
    source: number | GraphicElement;
    target: number | GraphicElement;
    enabledCirclesOnLink: boolean;
}
