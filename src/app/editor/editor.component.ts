import { Component, OnInit } from '@angular/core';
import { View } from '../shared/model/enum/view.enum';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {

  buttonText: string;
  private switchToDesignView = 'Switch To Design View';
  private switchToAnalysisView = 'Switch To Analysis View';

  currentDiagram: string;

  view: View;

  constructor() {
    this.view = View.DESIGN;
    this.buttonText = this.switchToAnalysisView;
  }

  ngOnInit() {
  }

  switchView() {
    if (this.view === View.DESIGN) {
      this.view = View.ANALYSIS;
      this.buttonText = this.switchToDesignView;
    } else {  // Analysis view
      this.view = View.DESIGN;
      this.buttonText = this.switchToAnalysisView;
    }
  }

  isDesignView() {
    return this.view === View.DESIGN;
  }

  isAnalysisView() {
    return this.view === View.ANALYSIS;
  }

  dataFlowDaigrmasPanelColSize() {
    if (this.view === View.DESIGN) {
      return 8;
    } else {  // Analysis view
      return 4;
    }
  }

  setCurrentDiagram(currentDiagram: string) {
    this.currentDiagram = currentDiagram;
  }
}
