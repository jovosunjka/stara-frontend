import { Injectable, Output, EventEmitter } from '@angular/core';
import { NewGraphicElement } from 'src/app/shared/model/new-graphic-element';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  // @Output() add: EventEmitter<GraphicElement> = new EventEmitter<GraphicElement>();
  private eventEmitters: Map<string, EventEmitter<Object>>;

  constructor() {
    this.eventEmitters = new Map<string, EventEmitter<Object>>();
  }

  addEventEmitterName(eventEmitterName: string) {
    this.eventEmitters.set(eventEmitterName, new EventEmitter<NewGraphicElement>());
  }

  addGraphicElement(diagramName: string, newGraphicElement: NewGraphicElement) {
    this.eventEmitters.get(diagramName).emit( newGraphicElement );
  }

  zoomOut(diagramName: string) {
    this.eventEmitters.get(diagramName + 'zoom_out').emit();
  }

  @Output()
  getEventEmitter(name: string): EventEmitter<Object> {
      return this.eventEmitters.get(name);
  }
}
