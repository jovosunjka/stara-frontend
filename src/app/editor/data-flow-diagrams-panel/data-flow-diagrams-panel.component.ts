import { Component, OnInit, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';
import * as d3 from 'd3';


@Component({
  selector: 'app-data-flow-diagrams-panel',
  templateUrl: './data-flow-diagrams-panel.component.html',
  styleUrls: ['./data-flow-diagrams-panel.component.css']
})
export class DataFlowDiagramsPanelComponent implements OnInit/*, AfterViewInit*/ {
  // static svgIdIndexGenerator = 0;

  diagrams: DataFlowDiagram[];

  currentDiagram: string;

  // selectSvgs: string[];

  @Output() currentDiagramEvent = new EventEmitter<string>();

  constructor(private toastr: ToastrService) {
    this.diagrams = [
      {id: 'id-context', name: 'Context', elements: [], flows: [], boundaries: [], sections: []},
      {id: 'id-mt-public', name: 'MT Public', elements: [], flows: [], boundaries: [], sections: []},
      {id: 'id-mt-internal', name: 'MT Internal', elements: [], flows: [], boundaries: [], sections: []}
    ];


    // this.selectSvgs = [];

  }

  ngOnInit() {
    if (this.diagrams && this.diagrams.length > 0) {
      this.currentDiagram = this.diagrams[0].id;
      this.currentDiagramEvent.emit(this.currentDiagram);
    } else {
      this.toastr.error('There are currently no diagrams in this model!');
    }
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
