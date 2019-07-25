import { Injectable } from '@angular/core';

// import * as jsonData from 'E:/STUDIRANJE/DIPLOMSKI RAD/project_workspace/stara-frontend/src/assets/config/graphic-elements.json';
import * as jsonData from 'src/assets/config/graphic-elements.json';
// zahvaljujuci tome sto je dodat fajl naziv_projekta/json=typings.d.ts,
// mozemo ovako importovati json fajl

@Injectable({
  providedIn: 'root'
})
export class GraphicElementsConfigService {

    private data: any = jsonData;

  constructor() {}

  getGraphicElements(): any[] {
    return this.data.default.elements;
  }
}
