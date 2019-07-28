import { Injectable, Output, EventEmitter } from '@angular/core';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';

@Injectable({
  providedIn: 'root'
})
export class DataFlowDiagramsService {

  @Output() addNewDiagram: EventEmitter<DataFlowDiagram> = new EventEmitter<DataFlowDiagram>();

  constructor() { }

  addNew(newDiagram: DataFlowDiagram) {
    this.addNewDiagram.emit( newDiagram );
  }

}
