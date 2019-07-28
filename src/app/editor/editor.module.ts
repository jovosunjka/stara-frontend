import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { ElementsPanelComponent } from './elements-panel/elements-panel.component';
import { DataFlowDiagramsPanelComponent } from './data-flow-diagrams-panel/data-flow-diagrams-panel.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { AssetsPanelComponent } from './assets-panel/assets-panel.component';
import { ThreatListPanelComponent } from './threat-list-panel/threat-list-panel.component';
import { ThreatAnalysisPanelComponent } from './threat-analysis-panel/threat-analysis-panel.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ToastrModule } from 'ngx-toastr';
import { CanvasService } from './canvas/service/canvas.service';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { GraphicElementsConfigService } from './services/graphic-elements-config/graphic-elements-config.service';
import { DataFlowDiagramsService } from './data-flow-diagrams-panel/service/data-flow-diagrams.service';



@NgModule({
  declarations: [
    EditorComponent,
    ElementsPanelComponent,
    DataFlowDiagramsPanelComponent,
    PropertiesPanelComponent,
    AssetsPanelComponent,
    ThreatListPanelComponent,
    ThreatAnalysisPanelComponent,
    CanvasComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ToastrModule.forRoot({preventDuplicates: true}), // ToastrModule added
    RouterModule,
    FormsModule,
    BrowserAnimationsModule, // required animations module
  ],
  providers: [
    CanvasService, GraphicElementsConfigService, DataFlowDiagramsService
  ],
  exports: [
    EditorComponent
  ]
})
export class EditorModule { }
