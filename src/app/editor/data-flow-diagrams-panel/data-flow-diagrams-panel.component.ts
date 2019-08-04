import { Component, OnInit, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';
import { DataFlowDiagramsService } from './service/data-flow-diagrams.service';
import { LoadModelService } from '../services/load-model/load-model.service';



@Component({
  selector: 'app-data-flow-diagrams-panel',
  templateUrl: './data-flow-diagrams-panel.component.html',
  styleUrls: ['./data-flow-diagrams-panel.component.css']
})
export class DataFlowDiagramsPanelComponent implements OnInit/*, AfterViewInit*/ {
  // static svgIdIndexGenerator = 0;

  diagrams: DataFlowDiagram[];

  currentDiagram: string;

  private idDiagramGenerator = 0;


  @Output() currentDiagramEvent = new EventEmitter<string>();

  constructor(private loadModelService: LoadModelService,
               private dataFlowDiagramsService: DataFlowDiagramsService,
                private toastr: ToastrService) {
    this.diagrams = this.loadModelService.getDataFlowDiagrams();
    this.idDiagramGenerator = this.diagrams.length - 1;
  }

  ngOnInit() {
    if (this.diagrams && this.diagrams.length > 0) {
      this.currentDiagram = this.diagrams[0].id;
      this.currentDiagramEvent.emit(this.currentDiagram);

      this.idDiagramGenerator = this.diagrams.length;
    } else {
      this.toastr.error('There are currently no diagrams in this model!');
    }
  }

  makeNewDiagram(diagramName: string) {
    const newId = 'id-diagram-' + this.idDiagramGenerator++;
    this.diagrams.push(
      {
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
      }
    );
    this.dataFlowDiagramsService.returnNewIdOfDiagram(newId);
    this.toastr.success('A new diagram is created for the complex process: diagramName');
  }

  removeComplexProcessDiagram(id: string) {
    const diagram: DataFlowDiagram = this.diagrams.filter(d => d.id === id)[0];
    const index = this.diagrams.indexOf(diagram);
    this.diagrams.splice(index, 1);
  }

  // ngAfterContentInit
  /*ngAfterViewInit() {
      for (let i = 0; i < this.diagrams.length; i++) {
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
    this.currentDiagram = newDiagram;
    this.currentDiagramEvent.emit(this.currentDiagram);
  }

}
