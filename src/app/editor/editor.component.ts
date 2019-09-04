import { Component, OnInit } from '@angular/core';
import { View } from '../shared/model/enum/view.enum';
import { ThreatModel } from '../shared/model/threat-model';
import { Guid } from 'guid-typescript';
// import { LoadModelService } from './services/load-model/load-model.service';
import { ToastrService } from 'ngx-toastr';
import { GraphicElement } from '../shared/model/graphic-element';
import { DataFlowDiagramsService } from './data-flow-diagrams-panel/service/data-flow-diagrams.service';
import { CanvasService } from './canvas/service/canvas.service';
// import { FormGroup, Validators, FormBuilder } from '@angular/forms';

// u fajlu angular.json, u atribut scripts ubaceno je: "node_modules/bootbox/dist/bootbox.min.js"
declare const bootbox: any;


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {

  model: ThreatModel;

  buttonText: string;
  private switchToDesignView = 'Switch To Design View';
  private switchToAnalysisView = 'Switch To Analysis View';

  currentDiagram: string;

  view: View;

  selectedItems: boolean;

  diagramsTabMaxLength = 5;

  staticPoints: boolean;

  // form: FormGroup;
  // fileName: string;


  constructor(private dataFlowDiagramsService: DataFlowDiagramsService, private canvasService: CanvasService,
              private toastr: ToastrService) {
    // this.model = this.loadModelService.getThreatModel();
    this.view = View.DESIGN;
    this.buttonText = this.switchToAnalysisView;
    this.selectedItems = false;
    this.staticPoints = false;
  }

  ngOnInit() {
    this.canvasService.changeSelectedItemsEvent.subscribe(
      (selectedItems: boolean) => this.selectedItems = selectedItems
    );

    this.doDeleteKeyDown();
  }

  /*createForm() {
    this.form = this.fb.group({
      threatModel: [null, Validators.required]
    });
  }*/

  onFileChange(event, that) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file) {
        const  reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = function (evt) {
          const target: any = evt.target;
          that.model = JSON.parse(target.result); // postavljamo novi threat moodel ucitan iz json fajla
          if (that.model.diagrams.length > 0) {
            that.setCurrentDiagram(that.model.diagrams[0].id);
          } else {
            that.toastr.warning('There are no diagrams in the loaded model!');
          }
        };
        reader.onerror = function (evt) {
            alert('LOAD .json (ERROR)');
        };

        const inputFile: any = document.getElementById('id_path_to_existing_model');
        inputFile.value = ''; // restujemo
      }
      // this.form.get('threatModel').setValue(file);
    }
  }

  createNewModel() {
    const that = this;
    bootbox.prompt({
        title: 'Enter a name for the new model',
        centerVertical: true,
        buttons: {
            confirm: {
                label: 'CREATE',
                className: 'btn-success'
            },
            cancel: {
                label: 'CANCEL',
                className: 'btn-danger'
            }
        },
        callback: function (name) {
            if (name) {
              name = name.trim();
            }
            console.log('This was logged in the callback: ' + name);

            if (name === '') {
              that.toastr.error('You did not enter the name of the new model!');
              return false;
              // that.createNewModel();
            } else if (name && name !== '') {
              that.continueCreateNewModel(name);
            }
        }
    });
  }

  createNewDiagram() {
    const that = this;
    bootbox.prompt({
        title: 'Enter a name for the new diagram',
        centerVertical: true,
        buttons: {
            confirm: {
                label: 'CREATE',
                className: 'btn-success'
            },
            cancel: {
                label: 'CANCEL',
                className: 'btn-danger'
            }
        },
        callback: function (name) {
            if (name) {
              name = name.trim();
            }
            console.log('This was logged in the callback: ' + name);

            if (name === '') {
              that.toastr.error('You did not enter the name of the new diagram!');
              return false;
            } else if (that.model.diagrams.map(d => d.name).includes(name)) {
              that.toastr.error('A diagram named ' + name + ' already exists in this model!');
              return false;
            } else if (name && name !== '') {
              that.continueCreateNewDiagram(name);
            }
        }
    });
  }

  continueCreateNewModel(nameOfNewModel: string) {
    const newModelId = 'id-' + Guid.create().toString();
    const firstDiagramId = newModelId + '_id-diagram-0';
    this.model = {
      id: newModelId,
      name: nameOfNewModel,
      diagrams: [
        {
          id: firstDiagramId,
          name: 'Context',
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
          sections: [],
          complexProcess: false
        }
      ]
    };

    this.toastr.success('You have successfully created a new model!');
  }

  continueCreateNewDiagram(nameOfNewDiagram: string) {
      this.dataFlowDiagramsService.addNew(nameOfNewDiagram);
  }

  switchView() {
    if (this.view === View.DESIGN) {
      this.view = View.ANALYSIS;
      this.buttonText = this.switchToDesignView;
      this.diagramsTabMaxLength = 2;
    } else {  // Analysis view
      this.view = View.DESIGN;
      this.buttonText = this.switchToAnalysisView;
      this.diagramsTabMaxLength = 5;
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

  getDateTimeStr() {
    const today = new Date();
    const date = today.getDate() + '.' + (today.getMonth() + 1 ) + '.' + today.getFullYear();
    const time = today.getHours() + ';' + today.getMinutes() + ';' + today.getSeconds();
    const dateTime = date + '-' + time;
    return dateTime;
  }

  export() {
      const that = this;

      bootbox.prompt({
        title: 'You want to export graphical data as well?',
        centerVertical: true,
        buttons: {
          confirm: {
              label: 'EXPORT',
              className: 'btn-success'
          },
          cancel: {
              label: 'CANCEL',
              className: 'btn-danger'
          }
        },
        // value: ['1', '3'],
        inputType: 'checkbox',
        inputOptions: [
          {
              text: 'Export graphical data',
              value: 'checked',
          }
        ],
        callback: function (result) {
            console.log(result);
            if (result !== null) {
              let jsonText;
              if (result.length === 1 && result[0] === 'checked') {
                // jsonText = JSON.stringify(that.model);
                /*that.model.diagrams.forEach( diagram => {
                  diagram.graph.links.forEach(l => {
                    l.source = (l.source as GraphicElement).id;
                    l.target = (l.target as GraphicElement).id;
                  });
                });*/
                jsonText = JSON.stringify(that.model, null, 2); // spacing level = 2
              } else {
                const modelWithoutGraph = {
                  id: that.model.id,
                  name: that.model.name,
                  diagrams: []
                };
                that.model.diagrams.forEach( diagram => {
                  const copyDiagram =  Object.assign({}, diagram);
                  delete copyDiagram.graph;
                  modelWithoutGraph.diagrams.push(copyDiagram);
                });
                // jsonText = JSON.stringify(modelWithoutGraph);
                jsonText = JSON.stringify(modelWithoutGraph, null, 2); // spacing level = 2
              }

              that.download(jsonText);
            }
        }
    });
  }

  download(jsonText) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonText));
    const dateTimeStr = this.getDateTimeStr();
    element.setAttribute('download', this.model.name + '_' + dateTimeStr + '.json');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  doDeleteKeyDown() {
    const that = this;
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Delete' && that.selectedItems) {
        that.deleteSelectedItems();

        // Prevent the browser from going back in the URL history
        event.preventDefault();
        event.stopPropagation();
      }
  });
  }

  deleteSelectedItems()  {
    this.canvasService.doAction(this.currentDiagram, 'remove-selected-graphic-elements', null);
    this.toastr.info('Delete selected items');
  }

  analyze() {
    this.switchView();
  }

}
