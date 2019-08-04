import { Injectable } from '@angular/core';

// import * as jsonData from 'E:/STUDIRANJE/DIPLOMSKI RAD/project_workspace/stara-frontend/src/assets/config/graphic-elements.json';
import * as jsonData from 'src/assets/config/stencils.json';
import { Stencil } from 'src/app/shared/model/stencil';
// zahvaljujuci tome sto je dodat fajl naziv_projekta/json=typings.d.ts,
// mozemo ovako importovati json fajl

@Injectable({
  providedIn: 'root'
})
export class StencilsConfigService {

  private data: any = jsonData;

  constructor() {}

  getStencils(): Stencil[] {
    return this.data.default.stencils;
  }
}
