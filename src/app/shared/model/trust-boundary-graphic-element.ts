import { GraphicElement } from './graphic-element';
import { CircleForManipulation } from './circle-for-manipulation';
import { Point } from './point';

export interface TrustBoundaryGraphicElement extends GraphicElement {
    points: Point[];
    circleForManipulation: CircleForManipulation;
}
