import { Injectable, EventEmitter, Output } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {

  @Output() selectedElementEvent: EventEmitter<Object> = new EventEmitter<Object>();

  constructor() { }

  setSelectedElement(selectedElement: Object) {
    this.selectedElementEvent.emit(selectedElement);
  }
}
