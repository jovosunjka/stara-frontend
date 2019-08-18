import { Injectable } from '@angular/core';
import * as jsonData from 'src/assets/models/test-model.json';
import { ThreatModel } from 'src/app/shared/model/threat-model';


@Injectable({
  providedIn: 'root'
})
export class LoadModelService {

  private data: any = jsonData;

  constructor() {}

  getThreatModel(): ThreatModel {
    return this.data.default;
  }
}
