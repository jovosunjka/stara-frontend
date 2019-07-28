import { Component, OnInit, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';
import { DataFlowDiagramsService } from './service/data-flow-diagrams.service';


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

  constructor(private dataFlowDiagramsService: DataFlowDiagramsService, private toastr: ToastrService) {
    this.diagrams = [
      {
        id: 'id-context',
        name: 'Context',
        elements: [],
        /*elements: [
          {
            element: {
                      name: 'Process 0',
                      type: 'process',
                      tag: 'circle',
                      properties: [{name: 'fill', value: 'blue'}]
                    },
            x: 20,
            y: 20,
            id: '0'
          },
          {
            element: {
                  name: 'Process 1',
                  type: 'process',
                  tag: 'circle',
                  properties: [{name: 'fill', value: 'blue'}]
                },
            x: 100,
            y: 100,
            id: this.idNodeGenerator++
          },
          {
            element: {
                  name: 'Process 2',
                  type: 'process',
                  tag: 'circle',
                  properties: [{name: 'fill', value: 'blue'}]
                },
            x: 200,
            y: 100,
            id: this.idNodeGenerator++
          },
          {
            element: {
                      name: 'Process 3',
                      type: 'process',
                      tag: 'circle',
                      properties: [{name: 'fill', value: 'blue'}]
                    },
            x: 50,
            y: 200,
            id: this.idNodeGenerator++
          },
          {
            element: {
                  name: 'Process 4',
                  type: 'process',
                  tag: 'circle',
                  properties: [{name: 'fill', value: 'blue'}]
                },
            x: 350,
            y: 200,
            id: this.idNodeGenerator++
          },
          {
            element: {
                  name: 'Process 5',
                  type: 'process',
                  tag: 'circle',
                  properties: [{name: 'fill', value: 'blue'}]
                },
            x: 100,
            y: 300,
            id: this.idNodeGenerator++
          },
          {
            element: {
                  name: 'Process 6',
                  type: 'process',
                  tag: 'circle',
                  properties: [{name: 'fill', value: 'blue'}]
                },
            x: 300,
            y: 300,
            id: this.idNodeGenerator++
          },
          {
            element: {
                  name: 'Process 7',
                  type: 'process',
                  tag: 'circle',
                  properties: [{name: 'fill', value: 'blue'}]
                },
            x: 300,
            y: 250,
            id: this.idNodeGenerator++
          }
        ],*/
        flows: [],
        boundaries: [],
        sections: []},
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

    this.dataFlowDiagramsService.addNewDiagram.subscribe(
      (newDataFlowDiagram: DataFlowDiagram) => {
        this.diagrams.push(newDataFlowDiagram);
      }
    );
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
