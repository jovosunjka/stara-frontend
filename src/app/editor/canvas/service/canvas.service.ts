import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  @Output() changeSelectedItemsEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  private eventEmitters: Map<string, EventEmitter<Object>>;

  constructor() {
    this.eventEmitters = new Map<string, EventEmitter<Object>>();
  }

  addEventEmitterName(diagramId: string) {
    this.eventEmitters.set(diagramId, new EventEmitter<Object>());
  }

  /*addGraphicElement(diagramName: string, newGraphicElement: NewGraphicElement) {
    this.eventEmitters.get(diagramName).emit( newGraphicElement );
  }

  zoomOut(diagramName: string) {
    this.eventEmitters.get(diagramName + 'zoom_out').emit();
  }*/

  doAction(diagramId: string, type: string, obj: any) {
    const eventEmitter = this.eventEmitters.get(diagramId);
    if (eventEmitter) {
        eventEmitter.emit( {type: type, obj: obj} );
    }
  }

  @Output()
  getEventEmitter(diagramId: string): EventEmitter<Object> {
      return this.eventEmitters.get(diagramId);
  }

  changeSelectedItems(selected: boolean) {
    this.changeSelectedItemsEvent.emit(selected);
  }

}
