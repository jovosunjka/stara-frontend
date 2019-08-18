import { Point } from './point';
import { GraphicElement } from './graphic-element';
import { CircleForManipulation } from './circle-for-manipulation';

export interface TrustBoundary extends GraphicElement {
    points: Point[];
    circleForManipulation: CircleForManipulation;
}
