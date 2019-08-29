import { Injectable, Output, EventEmitter } from '@angular/core';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';

@Injectable({
  providedIn: 'root'
})
export class DataFlowDiagramsService {

  @Output() addNewDiagram: EventEmitter<string> = new EventEmitter<string>();
  @Output() newIdOfDiagram: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  addNew(newDiagram: string) {
    this.addNewDiagram.emit( newDiagram );
  }

  returnNewIdOfDiagram(newId: string) {
    this.newIdOfDiagram.emit( newId );
  }

}
