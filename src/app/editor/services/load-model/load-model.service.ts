import { Injectable } from '@angular/core';
import * as jsonData from 'src/assets/models/test-model.json';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';


@Injectable({
  providedIn: 'root'
})
export class LoadModelService {

  private data: any = jsonData;

  constructor() {}

  getDataFlowDiagrams(): DataFlowDiagram[] {
    return this.data.default.diagrams;
  }
}
