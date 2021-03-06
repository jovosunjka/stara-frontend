import { GraphicElement } from './graphic-element';
import { Point } from './point';
import { CircleForManipulation } from './circle-for-manipulation';

export interface Link extends GraphicElement {
    points: Point[];
    source: string | GraphicElement;
    target: string | GraphicElement;
    circleForManipulation: CircleForManipulation;
}
