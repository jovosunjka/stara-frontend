import { Component, OnInit, EventEmitter, Output, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';
import { DataFlowDiagramsService } from './service/data-flow-diagrams.service';
import { ThreatModel } from 'src/app/shared/model/threat-model';



@Component({
  selector: 'app-data-flow-diagrams-panel',
  templateUrl: './data-flow-diagrams-panel.component.html',
  styleUrls: ['./data-flow-diagrams-panel.component.css']
})
export class DataFlowDiagramsPanelComponent implements OnInit, OnChanges {
  // static svgIdIndexGenerator = 0;

  @Input() model: ThreatModel;

  diagramsTab: DataFlowDiagram[];
  private DIAGRAMS_TAB_MAX_LENGTH = 5;

  currentDiagram: string;

  private idDiagramGenerator = 0;


  @Output() currentDiagramEvent = new EventEmitter<string>();

  constructor(private dataFlowDiagramsService: DataFlowDiagramsService,
                private toastr: ToastrService) {
  }

  ngOnInit() {
    if (this.model.diagrams && this.model.diagrams.length > 0) {
      this.diagramsTab = this.model.diagrams.slice(0, this.DIAGRAMS_TAB_MAX_LENGTH);

      this.currentDiagram = this.model.diagrams[0].id;
      this.currentDiagramEvent.emit(this.currentDiagram);

      this.idDiagramGenerator = this.model.diagrams.length;
    } else {
      this.toastr.error('There are currently no diagrams in this model!');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    /*const name: SimpleChange = changes.name;
    console.log('prev value: ', name.previousValue);
    console.log('got name: ', name.currentValue);
    this._name = name.currentValue.toUpperCase();*/

    // model je @Input() atribut
    if (!changes.model.firstChange) {
      this.diagramsTab = this.model.diagrams.slice(0, this.DIAGRAMS_TAB_MAX_LENGTH);

      this.currentDiagram = this.model.diagrams[0].id;
      this.currentDiagramEvent.emit(this.currentDiagram);

      this.idDiagramGenerator = this.model.diagrams.length;
    }
  }

  makeNewDiagram(diagramName: string) {
    this.removeAllActiveClasses();

    const newId =  this.model.id + '_id-diagram-' + this.idDiagramGenerator++;
    const newDiagram = {
      id: newId,
      name: diagramName,
      graph: {
          nodes: [],
          links: [],
          boundaries: [],
          sections: [],
          translateX: 0,
          translateY: 0,
          scale: 1
      },
      elements: [],
      flows: [],
      boundaries: [],
      sections: []
    };
    this.model.diagrams.push(newDiagram);
    this.diagramsTab.splice(0, 0, newDiagram); // insert on index 0
    if (this.diagramsTab.length > this.DIAGRAMS_TAB_MAX_LENGTH) {
      this.diagramsTab.slice(0, this.DIAGRAMS_TAB_MAX_LENGTH);
    }
    this.dataFlowDiagramsService.returnNewIdOfDiagram(newId);

    this.changeDiagram(newDiagram.id);

    this.toastr.success('A new diagram is created for the complex process: diagramName');
  }

  removeComplexProcessDiagram(id: string) {
    this.removeAllActiveClasses();

    const diagram: DataFlowDiagram = this.model.diagrams.filter(d => d.id === id)[0];
    const index = this.model.diagrams.indexOf(diagram);
    this.model.diagrams.splice(index, 1);

    const index2 = this.diagramsTab.indexOf(diagram);
    if (index2 >= 0) {
      this.diagramsTab.splice(index2, 1);
      for (const d of this.model.diagrams) {
        if (!this.diagramsTab.includes(d)) {
          this.diagramsTab.push(d);
          this.changeDiagram(d.id);
          break;
        }
      }
    }
  }

  // ngAfterContentInit
  /*ngAfterViewInit() {
      for (let i = 0; i < this.model.diagrams.length; i++) {
          this.selectSvgs.push('id_canvas_' + DataFlowDiagramsPanelComponent.svgIdIndexGenerator++);
      }

      const that = this;
      let index = 0;

      const a = d3.selectAll('app-canvas svg');

      d3.selectAll('app-canvas svg').attr('id', function() {
        return that.selectSvgs[index++];
      });
  }*/

  changeDiagram(newDiagram: string) {
    if (this.currentDiagram !== newDiagram) {
      this.currentDiagram = newDiagram;
      this.currentDiagramEvent.emit(this.currentDiagram);
    }
  }

  setTabOnFirstPlace(diagramId: string) {
    this.removeAllActiveClasses();

    const newFirstDiagram: DataFlowDiagram = this.model.diagrams.filter(d => d.id === diagramId)[0];
    const index = this.diagramsTab.map(d => d.id).indexOf(diagramId);
    if (index >= 0) {
        // this.diagramsTab.splice(index, 1); // remove
        this.addActiveClass(index);
    } else {
      this.diagramsTab.splice(0, 0, newFirstDiagram); // insert on index 0
      if (this.diagramsTab.length > this.DIAGRAMS_TAB_MAX_LENGTH) {
        this.diagramsTab.slice(0, this.DIAGRAMS_TAB_MAX_LENGTH);
      }
    }

    this.changeDiagram(diagramId);
  }

  removeAllActiveClasses() {
    const activesTab = document.querySelectorAll('.nav-tabs a.active');
    activesTab.forEach(element => element.classList.remove('active'));

    const activesTabContent = document.querySelectorAll('.tab-content div.active');
    activesTabContent.forEach(element => element.classList.remove('active'));

    // za svaki slucaj uklanjamo sve active-ne (trebalo bi da budes samo jedan,
    // ali mozda ih slucajno ima vise)
  }

  addActiveClass(index) {
    const tab = document.querySelectorAll('.nav-tabs a')[index];
    tab.classList.add('active');

    const t = document.querySelectorAll('.tab-content div');
    const tabContent = t[index];
    tabContent.classList.add('active');
  }

}
