import { Injectable, EventEmitter, Output } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {

  @Output() selectedElementEvent: EventEmitter<Object> = new EventEmitter<any>();

  private refreshCanvasEventEmitters: Map<string, EventEmitter<any>>;

  constructor() {
    this.refreshCanvasEventEmitters = new Map<string, EventEmitter<any>>();
  }

  addEventEmitterName(diagramId: string) {
    this.refreshCanvasEventEmitters.set(diagramId, new EventEmitter<Object>());
  }

  @Output()
  getEventEmitter(diagramId: string): EventEmitter<any> {
      return this.refreshCanvasEventEmitters.get(diagramId);
  }

  setSelectedElement(selectedElement: any) {
    this.selectedElementEvent.emit(selectedElement);
  }

  refreshCanvas(diagramId: string, selectedElementId) {
    this.refreshCanvasEventEmitters.get(diagramId).emit(selectedElementId);
  }
}
