import { Component, OnInit, AfterContentInit, Input, AfterViewInit, EventEmitter, Output } from '@angular/core';
import * as d3 from 'd3';
import { lasso } from 'd3-lasso';
import { CanvasService } from './service/canvas.service';
import { GraphicElement } from 'src/app/shared/model/graphic-element';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';
import { ContextMenuService } from 'ngx-contextmenu';
import { Link } from 'src/app/shared/model/link';
import { StencilsConfigService } from '../services/stencils-config/stencils-config.service';
import { Stencil } from 'src/app/shared/model/stencil';
import { Point } from 'src/app/shared/model/point';
import { RunLevel } from 'src/app/shared/model/enum/run-level.enum';
import { Flow } from 'src/app/shared/model/flow';
import { DataFlowDiagramsService } from '../data-flow-diagrams-panel/service/data-flow-diagrams.service';
import { PropertiesService } from '../properties-panel/service/properties.service';
import { TrustBoundary } from 'src/app/shared/model/trust-boundary';
import { TrustBoundaryGraphicElement } from 'src/app/shared/model/trust-boundary-graphic-element';

// u fajlu angular.json, u atribut scripts ubaceno je: "node_modules/d3plus/d3plus.full.min.js"
declare const d3plus: any;

// u fajlu angular.json, u atribut scripts ubaceno je: "node_modules/raphael/raphael.min.js"
declare const Raphael: any;


@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, AfterViewInit /*AfterContentInit*/ {
  selectSvg: string;
  idSvg: string;

  @Input()
  diagram: DataFlowDiagram;
  @Input()
  numOfElements: number;
  @Input()
  staticPoints: boolean;

  @Output() addNewDiagram: EventEmitter<string> = new EventEmitter<string>();
  @Output() removeDiagram: EventEmitter<string> = new EventEmitter<string>();

  elements: any[];

  dragHandler: any;
  d3Lasso: any;

  // private IMAGE_SIZE = 42;

  // private simulation: any;
  private gNode: any;
  private node: any;
  private link: any;
  private nodeText: any;
  private linkText: any;
  private linkArrow: any;
  private trustBoundary: any;

  private selectedItems: any;

  private idNodeGenerator = 0;
  private idLinkGenerator = 0;
  private idTrustBoundaryGenerator = 0;

  private SHAPE_SIZE = 80; // 70
  private TEXT_SIZE = 12;


  private MAX_ZOOM_OUT = 0.2;
  private MAX_ZOOM_IN = 100;
  // private scale = 1;
  // private translateX = 0;
  // private translateY = 0;

  private zoom: any;

  stencils: Stencil[];

  lineGenerator: any;

  private patternImageGenerator = 0;
  private imagesMap: Map<string, string>;

  newElementData: any;

  private SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  private nodeTextConfig: any;

  constructor(private stencilsConfigService: StencilsConfigService,
              private dataFlowDiagramsService: DataFlowDiagramsService,
               private canvasService: CanvasService, private contextMenuService: ContextMenuService,
               private propertiesService: PropertiesService) {
    this.stencils = this.stencilsConfigService.getStencils();

    this.imagesMap = new Map();

    this.nodeTextConfig = {
      'width': this.SHAPE_SIZE,
      'height': this.SHAPE_SIZE,
      'resize': false
    };
  }

  ngOnInit() {
    this.idSvg = this.diagram.id + '-canvas';
    this.selectSvg = 'svg#' + this.idSvg;

    this.idNodeGenerator = this.diagram.graph.nodes.length;
    this.idLinkGenerator = this.diagram.graph.links.length;
    this.idTrustBoundaryGenerator = this.diagram.graph.boundaries.length;

    this.dataFlowDiagramsService.newIdOfDiagram.subscribe(
      (newId: string) => {
        if (this.newElementData) {
          this.newElementData.idOfDiagram = newId;
          console.log('New id: ' + newId);
        }
      }
    );
  }

  // ngAfterContentInit() {
  ngAfterViewInit() {
    /*this.dragHandler = d3.drag()
        .on('drag', function (d: any) {
            d3.select(this)
                .attr('x', d3.event.x)
                .attr('y', d3.event.y);
        });

    this.dragHandler(d3.selectAll('image'));
    */
    /*const data = [
      {text: 'Here is <i>some</i> sample text that has been <strong>wrapped</strong> using d3plus.textBox.'},
      {text: '...and here is a <b>second</b> sentence!'},
      {text: '这是句3号。这也即使包装没有空格！'}
    ];
   new d3plus.TextBox()
   .data(data)
   .fontSize(16)
   .width(200)
   .x(function(d, i) { return i * 250; })
   .render();*/

    this.lineGenerator = d3.line().curve(d3.curveCardinal);

    this.makeGraph();

    // prilikom kreiranja grafa resize ce biti inicijalno setovan na false, a nakon toga postavljamo na true
    // realno na pocetku nema resize-ovanje, a i sprecice neko brljavljenje i ispisivanje prevelikih slova
    this.nodeTextConfig.resize = true;

    this.doZoom(d3.select(this.selectSvg));

    this.doLassoSelect();

    // dodajemo svoj eventEmitterName u mapu svih eventEmitter-a
    this.canvasService.addEventEmitterName(this.diagram.id);

    this.canvasService.getEventEmitter(this.diagram.id).subscribe(
      (action: any) => {
        if (action.type === 'add-new-graphic-element') {
            const stencil: Stencil = this.getStencil(action.obj.stencilId);
            const idOfData: any = this.addElementData(stencil.type);
            if (idOfData) {
              action.obj.idOfData = idOfData;
              this.addGraphicElement(action.obj, stencil.type);
            }
        } else if (action.type === 'remove-graphic-element') {
            this.removeGraphicElement(action.obj);
        } else if (action.type === 'remove-selected-graphic-elements') {
          this.removeSelectedGraphicElements();
        } else if (action.type === 'show-properties') {
          this.showProperties({type: action.obj.type, id: action.obj.id, idOfData: this.getIdOfData(action.obj)});
        } else if (action.type === 'changed-tab') {
          this.changedTabChangeSelectedItems();
        } else if (action.type === 'zoom-out') {
            this.zoomOut();
        }
      }
    );

    // dodajemo svoj eventEmitterName u mapu svih eventEmitter-a
    this.propertiesService.addEventEmitterName(this.diagram.id);

    const that = this;

    this.propertiesService.getEventEmitter(this.diagram.id).subscribe(
      (graphicElement: any) => {
        // this.nodeTextConfig.resize = true;
        // this.restart();
        if (graphicElement.type === 'data-flow') {
             this.linkText.each(function(d, i) {
                if (d.id === graphicElement.id) {
                  d3.select(this).text(that.getGraphicElement(d.idOfData, graphicElement.type).name);
                }
             });
        } else {
          this.gNode.each(function(d, i) {
            if (d.id === graphicElement.id) {

              const name = that.getGraphicElement(d.idOfData, graphicElement.type).name;
              const stencil = that.getStencil(d.stencilId);

              let textColor: string;
              if (stencil.type === 'complex-process' || stencil.type === 'data-store') {
                  textColor = 'green';
              } else {
                  textColor = 'white';
              }

              const self = d3.select(this);

              self.select('.node title').text(name);

              self.select('text').remove();
              self.append('text')
                  // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
                  // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
                  // .attr('text-anchor', 'middle')
                  .attr('font-size', that.TEXT_SIZE)
                  .attr('font-family', 'sans-serif')
                  .attr('fill', textColor)
                  .attr('id', that.idSvg + '_id_text' + i)
                  // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')*/
                  .text(name)
                  .classed('wrap', true)
                  .classed('node-text', true)
                  .classed('zoom-element', true);

              that.nodeTextConfig.resize = true;

              let shape: string;
              if (stencil.tag === 'circle' || stencil.tag === 'image') {
                  shape = 'circle';
              } else {
                  shape = 'square';
              }

              d3plus.textwrap()
                  // .config(that.nodeTextConfig)
                  .container('#' + that.idSvg + '_id_text' + i)
                  // .resize(true)
                  .shape(shape)
                  .padding(10)
                  // .align('middle')
                  .valign('middle')
                  .draw();
              that.nodeTextConfig.resize = true;
            }
          });
        }
      }
    );

    d3.select(this.selectSvg).on('click', function () {
      if (d3.event.defaultPrevented) {
        return;
      }

      that.clickOnSvg();
    });
  }

  getData(obj: any) {
    let data = null;
    let idOfData = '';
    switch (obj.type) {
      case 'process':
      case 'complex-process':
      case 'external-entity':
      case 'data-store':
        idOfData = this.diagram.graph.nodes.filter(n => n.id === obj.id)[0].idOfData;
        data = this.diagram.elements.filter(e => e.id === idOfData)[0];
        break;
      case 'data-flow':
        idOfData = this.diagram.graph.links.filter(l => l.id === obj.id)[0].idOfData;
        data = this.diagram.flows.filter(f => f.id === idOfData)[0];
        break;
      case 'trust-boundary':
        idOfData = this.diagram.graph.boundaries.filter(b => b.id === obj.id)[0].idOfData;
        data = this.diagram.boundaries.filter(b => b.id === idOfData)[0];
        break;
      default:
        alert('Not implemented for type: ' + obj.type + ' (getData method)');
        break;
    }

    return data;
  }

  getIdOfData(obj: any) {
    const data = this.getData(obj);
    if (data) {
      return data.id;
    }
    return '';
  }

  changedTabChangeSelectedItems() {
    let selected: boolean;
    if (this.selectedItems) {
      selected = this.selectedItems.size() > 0;
    } else {
      selected = false;
    }
    this.canvasService.changeSelectedItems(selected);
  }


  public onContextMenu($event: MouseEvent, item: any): void {
    this.contextMenuService.show.next({
      // Optional - if unspecified, all context menu components will open
      // contextMenu: this.contextMenu,
      event: $event,
      item: item,
    });
    // $event.preventDefault();
    // $event.stopPropagation();
  }

  removeSelectedGraphicElements() {
    const that = this;
    const items = [];
    this.selectedItems.each(function (d: any) {
      items.push(d);
    });

    this.deselectLasso();

    items.forEach(
      item => this.removeGraphicElement( { type: that.getStencil(item.stencilId).type, id: item.id } )
    );

    this.doLassoSelect(); // restart Lasso select
  }

  removeGraphicElement(graphicElementForRemoving: any) {
      if (graphicElementForRemoving.type === 'data-flow') {
          /*const indexOfLastLink =  this.diagram.graph.links.length - 1;
          const tmp = this.diagram.graph.links[graphicElementForRemoving.index];
          this.diagram.graph.links[graphicElementForRemoving.index] = this.diagram.graph.links[indexOfLastLink];
          this.diagram.graph.links[indexOfLastLink] = tmp;
          this.diagram.graph.links.splice(indexOfLastLink, 1);*/
          const graphLink = this.diagram.graph.links.filter(l => l.id === graphicElementForRemoving.id)[0];
          const graphLinkIndex = this.diagram.graph.links.indexOf(graphLink);
          // uklanjamo podatke vezane za graficki prikaz linka
          this.diagram.graph.links.splice(graphLinkIndex, 1);

          const flow: Flow = this.diagram.flows.filter(f => f.id === graphLink.idOfData)[0];
          const  index = this.diagram.flows.indexOf(flow);
          this.diagram.flows.splice(index, 1); // uklanjamo i iz podataka

          flow.boundariesCrossed.forEach(boundaryId => {
            const boundary: TrustBoundary = this.diagram.boundaries.filter(b => b.id === boundaryId)[0];
            const boundaryIndex = boundary.links.indexOf(flow.id);
            boundary.links.splice(boundaryIndex, 1);
        });
      } else if (graphicElementForRemoving.type === 'process'
                || graphicElementForRemoving.type === 'complex-process'
                || graphicElementForRemoving.type === 'external-entity'
                || graphicElementForRemoving.type === 'data-store') {
          const graphNode = this.diagram.graph.nodes.filter(n => n.id === graphicElementForRemoving.id)[0];
          this.diagram.graph.links.forEach(link => {
              let flow: Flow = null;
              if (link.source && link.source === graphNode.id) {
                // uklanjamo referencu ka source-u u podacima o grafickom prikazu linka
                link.source = null;
                flow = this.diagram.flows.filter(f => f.id === link.idOfData)[0];
                // uklanjamo id source-a u podacima
                flow.source = null;
              }

              if (link.target && link.target === graphNode.id) {
                // uklanjamo referencu ka target-u u podacima o grafickom prikazu linka
                link.target = null;
                if (!flow) {
                  flow = this.diagram.flows.filter(f => f.id === link.idOfData)[0];
                }
                // uklanjamo id destination-a u podacima
                flow.destination = null;
              }
          });

          const graphNodeIndex = this.diagram.graph.nodes.indexOf(graphNode);
          // uklanjamo podatke vezane za graficki prikaz elementa
          this.diagram.graph.nodes.splice(graphNodeIndex, 1);

          const element: any = this.diagram.elements.filter(e => e.id === graphNode.idOfData)[0];
          const  index = this.diagram.elements.indexOf(element);
          this.diagram.elements.splice(index, 1); // uklanjamo i iz podataka

          if (graphicElementForRemoving.type === 'complex-process') {
            this.removeDiagram.emit(element.idOfDiagram);
          }
      } else if (graphicElementForRemoving.type === 'trust-boundary') {
        const graphTrustBoundary = this.diagram.graph.boundaries.filter(b => b.id === graphicElementForRemoving.id)[0];
          const graphTrustBoundaryIndex = this.diagram.graph.boundaries.indexOf(graphTrustBoundary);
          // uklanjamo podatke vezane za graficki prikaz trustBounday-a
          this.diagram.graph.boundaries.splice(graphTrustBoundaryIndex, 1);

          const trustBoundary: TrustBoundary = this.diagram.boundaries.filter(f => f.id === graphTrustBoundary.idOfData)[0];
          const  index = this.diagram.boundaries.indexOf(trustBoundary);
          this.diagram.boundaries.splice(index, 1); // uklanjamo i iz podataka

          trustBoundary.links.forEach(
            linkId => {
              const boundariesCrossed = this.diagram.flows.filter(f => f.id === linkId)[0].boundariesCrossed;
              const i = boundariesCrossed.indexOf(trustBoundary.id);
              boundariesCrossed.splice(i, 1);
            }
          );
      }  else {
        alert('Not implemented for type: ' + graphicElementForRemoving.type + ' (removeGraphicElement method)');
      }

      this.restart();
  }

  addGraphicElement(graphicElement: GraphicElement, type: string) {
    if (type === 'data-flow') {
      const newLink: Link =  {
        id: this.diagram.id + '_id-link-' + this.idLinkGenerator++,
        stencilId: graphicElement.stencilId,
        // position: graphicElement.position,
        idOfData: graphicElement.idOfData,
        points: [
          { x: graphicElement.position.x, y: graphicElement.position.y },
          { x: (graphicElement.position.x + graphicElement.position.x + this.SHAPE_SIZE) / 2,
            y: graphicElement.position.y },
          { x: graphicElement.position.x + this.SHAPE_SIZE, y: graphicElement.position.y},
        ],
        source: null,
        target: null,
        circleForManipulation: {
          enabled: false,
          color: 'red'
        }
      };
      this.diagram.graph.links.push(newLink);
    } else if (type === 'trust-boundary') {
      const newTrustBoundary: TrustBoundaryGraphicElement =  {
        id: this.diagram.id + '_id-trust-boundary-' + this.idTrustBoundaryGenerator++,
        stencilId: graphicElement.stencilId,
        idOfData: graphicElement.idOfData,
        points: [
          { x: graphicElement.position.x, y: graphicElement.position.y },
          { x: (graphicElement.position.x + graphicElement.position.x + this.SHAPE_SIZE) / 2,
            y: graphicElement.position.y },
          { x: graphicElement.position.x + this.SHAPE_SIZE, y: graphicElement.position.y},
        ],
        circleForManipulation: {
          enabled: false,
          color: 'blue'
        }
      };
      this.diagram.graph.boundaries.push(newTrustBoundary);
    } else if (type === 'complex-process' || type === 'process' || type === 'external-entity' || type === 'data-store') {
      // const newId = this.idNodeGenerator++;
      // graphicElement.name += ' ' + newId;
      graphicElement.id = this.diagram.id + '_id-node-' + this.idNodeGenerator++;
      graphicElement.idOfData = graphicElement.idOfData;
      this.diagram.graph.nodes.push(graphicElement);
    } else {
      alert('Not implemented for type: ' + type + ' (addGraphicElement method)');
    }

    this.restart();
  }

  addElementData(type: string) {
    let idOfData: string;
    let len: number;

    switch (type) {
      case 'process':
      case 'complex-process':
        len = this.diagram.elements.length;
        idOfData = this.diagram.id + '_id-element-' + len;
        this.newElementData = {
          id: idOfData,
          name: (type === 'process' ? 'Process ' : 'Complex process ') + this.numOfElements,
          outOfScope: false,
          outOfScopeReason: 'Out of scope reason ' + len,
          exploits: [],
          importAssets: [],
          importExploits: [],
          section: 'section ' + len,
          runLevel: RunLevel.HIGH_PRIVILEGE,
          assets: [],
          sanitizeInput: false,
          sanitizeOutput: true,
          hasForgeryProtection: false,
          sessionHasTimeouts: true,
          requiresAuthentication: false,
          requiresAuthorization: true
        };
        if (type === 'complex-process') {
          this.addNewDiagram.emit(this.newElementData.name);
        }

        this.diagram.elements.push(this.newElementData);
        break;

      case 'data-flow':
        len = this.diagram.flows.length;
        idOfData = this.diagram.id + '_id-flow-' + len;
        const newFlowData = {
          id: idOfData,
          name: 'Data flow ' + len,
          outOfScope: true,
          outOfScopeReason: 'Out of scope reason ' + len,
          exploits: [],
          importAssets: [],
          importExploits: [],
          source: null,
          destination: null,
          containsCookies: true,
          containsXML: false,
          boundariesCrossed: [],
          assets: []
        };
        this.diagram.flows.push(newFlowData);
        break;

      case 'trust-boundary':
        len = this.diagram.boundaries.length;
        idOfData = this.diagram.id + '_id-boundary-' + len;
        const newBoundaryData = {
          id: idOfData,
          name: 'Trust boundary ' + len,
          links: []
        };
        this.diagram.boundaries.push(newBoundaryData);
        break;

      case 'external-entity':
        len = this.diagram.elements.length;
        idOfData = this.diagram.id + '_id-element-' + len;
        const newExternalEntityData = {
          id: idOfData,
          name: 'External entity ' + len,
          outOfScope: false,
          outOfScopeReason: '',
          exploits: [],
          importAssets: [],
          importExploits: [],
          sanitizeInput: false,
          sanitizeOutput: false,
          isThreadSafe: false,
          section: '',
          runLevel: RunLevel.HIGH_PRIVILEGE,
          assets: []
        };
        this.diagram.elements.push(newExternalEntityData);
        break;

      case 'data-store':
        len = this.diagram.elements.length;
        idOfData = this.diagram.id + '_id-element-' + len;
        const newDataStoreData = {
          id: idOfData,
          name: 'Data store ' + len,
          outOfScope: false,
          outOfScopeReason: 'Out of scope reason ' + len,
          exploits: [],
          importAssets: [],
          importExploits: [],
          section: 'Section ' + len,
          runLevel: RunLevel.HIGH_PRIVILEGE,
          assets: [],
          dataIsEncrypted: false,
          dataIsSigned: true,
          storeCredentials: false,
          hasBackup: true
        };
        this.diagram.elements.push(newDataStoreData);
        break;

      default:
        idOfData = null;
        alert('Not implemented for type: ' + type + ' (addElementData method)');
        break;
    }

    return idOfData;
  }

  zoomOut() {
    this.diagram.graph.translateX = 0;
    this.diagram.graph.translateY = 0;
    this.diagram.graph.scale = 1;

    const svgCanvas = d3.select(this.selectSvg);

    // resetovanje zoom-a
    svgCanvas.call(this.zoom.transform, d3.zoomIdentity);
    // Or equivalently
    // this.zoom.transform(svgCanvas, d3.zoomIdentity);

    // this.ticked();
  }

  restart() {
    const that = this;
    const svgCanvas = d3.select(this.selectSvg);
    // this.simulation.stop();

    // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
    this.link = this.link.data(this.diagram.graph.links);
    this.link.exit().remove();
    this.link = this.link.enter()
              .append('path')
              .merge(this.link)
              .classed('graphical-element', true)
              .classed('zoom-element', true)
              .classed('link', true)
              .style('cursor', 'move')
              .call(d3.drag()
                .on('start', function(d) {
                  that.dragstarted(d);
                })
                .on('drag', function(d) {
                  that.dragged(d, -1);
                })
                .on('end', function(d) {
                  that.dragended(d, this);
                }));

    this.link.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLinkOrBoundary(d, this);
      } else {
        d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
        d3.select(this).classed('selected', true);
        that.onContextMenu(d3.event, {type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.link.on('click', function(d, i) {
      d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
      d3.select(this).classed('selected', true);
      that.showProperties({type: that.getStencil(d.stencilId).type, id: d.id, idOfData: d.idOfData});

       // ovo ce prekinuti obradu ovog eventa
       d3.event.preventDefault();
       d3.event.stopPropagation();
    });

    this.link.each(function(d: any, i) {
      const self = d3.select(this);

      const stencil = that.getStencil(d.stencilId);

      stencil.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (stencil.tag === 'path') {
            if (d.source && d.target && !that.staticPoints) {
              const source = that.getNode(d.source);
              const target = that.getNode(d.target);
              const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(source.position.x + that.SHAPE_SIZE / 2,
                                                                source.position.y + that.SHAPE_SIZE / 2,
                                                                target.position.x + that.SHAPE_SIZE / 2,
                                                                target.position.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              d.points = [
                startPoint,
                // [startPoint[0], startPoint[1] - 10],
                // startPoint,
                // [startPoint[0], startPoint[1] + 10],
                // startPoint,
                { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2},
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                endPoint
                // [endPoint[0], endPoint[1] - 10],
                // endPoint,
                // [endPoint[0], endPoint[1] + 10]
             ];
            }

            const pathData = that.lineGenerator(d.points.map(point => [point.x, point. y]));
            self.attr('d', pathData);
      }

    });
    this.link = svgCanvas.selectAll(this.selectSvg + ' .link');

     // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
     this.diagram.graph.nodes
     .filter(n => this.getStencil(n.stencilId).tag === 'image')
     .forEach(n => {
       const imagePath = this.getStencil(n.stencilId).properties.filter(prop => prop.name === 'xlink:href')[0].value;
       if (!this.imagesMap.has(imagePath)) {
         const patternId = 'id-pattern-image-' + this.patternImageGenerator++;
         this.imagesMap.set(imagePath, patternId);

         svgCanvas.select('defs')
                 .append('pattern')
                   .attr('id', patternId)
                   // .attr('patternUnits', 'objectBoundingBox')
                   .attr('patternContentUnits', 'objectBoundingBox')
                   .attr('height', this.SHAPE_SIZE)
                   .attr('width', this.SHAPE_SIZE)
                   .append('image')
                     .attr('x', 0)
                     .attr('y', 0)
                     .attr('height', this.SHAPE_SIZE)
                     .attr('width', this.SHAPE_SIZE)
                     .attr('xlink:href', imagePath);
       }
     });

    // this.nodeTextConfig.resize = false;

    this.gNode = svgCanvas.selectAll(this.selectSvg + ' g.g-node').data(this.diagram.graph.nodes);
    this.gNode.exit().remove();
    svgCanvas.selectAll(this.selectSvg + ' g.g-node .node').remove();
    svgCanvas.selectAll(this.selectSvg + ' g.g-node text').remove();
    this.gNode = this.gNode.enter()
        .append('g')
        .merge(this.gNode)
        .classed('g-node', true)
        .each(function(d: any, i) {
          const stencil: Stencil = that.getStencil(d.stencilId);
          const self = d3.select(this);
          const nodeElement = self.append(() => {
              let tagName;
              if (stencil.tag === 'image') {
                tagName = 'circle';
              } else {
                tagName = stencil.tag;
              }
              // return document.createElement(tagName);
              // bez SVG_NAMESPACE kreira elemente u DOM stablu, ali iz nekog razloga ne budu vidljivi
              return document.createElementNS(that.SVG_NAMESPACE, tagName);
            }
          )
          .classed('shape', true)
          .classed('graphical-element', true)
          .classed('zoom-element', true)
          .classed('node', true)
          .style('cursor', 'move')
          .call(d3.drag()
          .on('start', function() {
            that.dragstarted(d);
          })
          .on('drag', function() {
            that.dragged(d, i);
          })
          .on('end', function() {
            that.dragended(d, this);
          }));

          let shape: string;
          if (stencil.tag === 'circle' || stencil.tag === 'image') {
            nodeElement.attr('r', that.SHAPE_SIZE / 2)
                .attr('cx', d.position.x + that.SHAPE_SIZE / 2)
                .attr('cy', d.position.y + that.SHAPE_SIZE / 2);

            if (stencil.tag === 'circle') {
                stencil.properties.forEach(prop => {
                  nodeElement.attr(prop.name, prop.value);
                });
            } else if (stencil.tag === 'image') {
              const imagePath = stencil.properties.filter(prop => prop.name === 'xlink:href')[0].value;
              nodeElement.attr('fill', 'url(#' + that.imagesMap.get(imagePath) + ')');
            }
            shape = 'circle';
          } else if (stencil.tag === 'rect') {
            nodeElement
                .attr('x', d.position.x)
                .attr('y', d.position.y)
                .attr('width', that.SHAPE_SIZE)
                .attr('height', that.SHAPE_SIZE * 3 / 4)
                .attr('stroke-dasharray', `${that.SHAPE_SIZE} ${that.SHAPE_SIZE * 3 / 4} ${that.SHAPE_SIZE} ${that.SHAPE_SIZE * 3 / 4}`);
            stencil.properties.forEach(prop => {
              nodeElement.attr(prop.name, prop.value);
            });
            shape = 'square';
          }

          const name = that.getGraphicElement(d.idOfData, stencil.type).name;

          nodeElement.append('title').text(name);

          let textColor: string;
          if (stencil.type === 'complex-process' || stencil.type === 'data-store') {
              textColor = 'green';
          } else {
              textColor = 'white';
          }

          self.append('text')
              // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
              // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
              // .attr('text-anchor', 'middle')
              .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', textColor)
              .attr('id', that.idSvg + '_id_text' + i)
              // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')
              .text(name)
              .classed('wrap', true)
              .classed('node-text', true)
              .classed('zoom-element', true);

          d3plus.textwrap()
              // .config(that.nodeTextConfig)
              .container('#' + that.idSvg + '_id_text' + i)
              .shape(shape)
              .padding(10)
              // .align('middle')
              .valign('middle')
              .draw();
        });

    // this.nodeTextConfig.resize = true;

    this.gNode = svgCanvas.selectAll(this.selectSvg + ' g.g-node');
    this.nodeText = svgCanvas.selectAll(this.selectSvg + ' .node-text');
    this.node = svgCanvas.selectAll(this.selectSvg + ' .node');

    this.node.on('contextmenu', function(d: any, i) {
      d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
      d3.select(this).classed('selected', true);
      that.onContextMenu(d3.event, {type: that.getStencil(d.stencilId).type, id: d.id});

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.node.on('click', function(d, i) {
      d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
      d3.select(this).classed('selected', true);
      that.showProperties({type: that.getStencil(d.stencilId).type, id: d.id, idOfData: d.idOfData});

        // ovo ce prekinuti obradu ovog eventa
        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    this.linkArrow = this.linkArrow.data(this.diagram.graph.links);
    this.linkArrow.exit().remove();
    this.linkArrow = this.linkArrow.enter()
              .append('path')
              .merge(this.linkArrow)
              .attr('stroke', '#ffa500')
              .attr('stroke-width', 5)
              // .attr('fill', 'none')
              .attr('fill', '#ffa500')
              .classed('link-arrows', true)
              .classed('zoom-element', true)
              .each(function(d: any, i) {
                  const self = d3.select(this);
                  const endPoint = d.points[d.points.length - 1];
                  let offset = 0;

                  const points = [ // formiramo trougao
                    [endPoint.x, endPoint.y + 10],
                    [endPoint.x + 10, endPoint.y],
                    [endPoint.x, endPoint.y - 10],
                    [endPoint.x, endPoint.y + 10]
                  ];

                  const pathData = that.lineGenerator(points);
                  self.attr('d', pathData);

                  let angle = 0;
                  if (d.target && !that.staticPoints) {
                    const target = that.getNode(d.target);
                    const point = { x: target.position.x + that.SHAPE_SIZE / 2, y: target.position.y + that.SHAPE_SIZE / 2 };
                    if (point.x >= endPoint.x) {
                        offset = 0;
                    } else {
                        offset = 180;
                    }
                    angle = that.getAngleForRotating(point, endPoint, offset);
                  } else {
                    let transform = self.attr('transform');
                    if (transform && transform.includes('rotate')) {
                      transform = transform.trim();
                      const tokens: string[] = transform.split(' ');
                      angle = +tokens[2].replace('rotate(', '').replace(')', '');
                    }
                  }

                  console.log('angle: ' + angle);
                  const firstThreePoints = points.slice(0, points.length - 1);
                  const xMean = d3.mean(firstThreePoints.map(p => p[0]));
                  const yMean = d3.mean(firstThreePoints.map(p => p[1]));
                  // xMean i yMean predstavljaju koordinate tacke (teziste) oko koje cemo rotirati strelice (trouglove)
                  self.attr('transform', `rotate(${angle + ' ' + xMean + ' ' + yMean})`);
                  // self.attr('transform-origin', xMean + ' ' + yMean);
                  // }
              });

    this.linkText = this.linkText.data(this.diagram.graph.links);
    this.linkText.exit().remove();
    this.linkText = this.linkText.enter()
              .append('text')
              .merge(this.linkText)
              .attr('x', function(d: any) {
                  return d.points[1].x + 10;
                  // return d3.mean(d.points.map(point => point[0]));
              })
              .attr('y', function(d: any) {
                  return d.points[1].y;
                  // return d3.mean(d.points.map(point => point[1]));
              })
              // .attr('text-anchor', 'middle')
              .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'white')
              .attr('filter', 'url(#' + that.idSvg + '_id_yellow_color)')
              .text(function(d: any) {
                  return that.getGraphicElement(d.idOfData, 'data-flow').name;
              })
              .classed('link-text', true)
              .classed('zoom-element', true);
    this.linkText = svgCanvas.selectAll(this.selectSvg + ' text.link-text');


    // ovde je bio node


    this.trustBoundary = this.trustBoundary.data(this.diagram.graph.boundaries);
    this.trustBoundary.exit().remove();
    this.trustBoundary = this.trustBoundary.enter()
              .append('path')
              .merge(this.trustBoundary)
              .classed('graphical-element', true)
              .classed('zoom-element', true)
              .classed('trust-boundary', true)
              .style('cursor', 'move')
              .call(d3.drag()
                .on('start', function(d) {
                  that.dragstarted(d);
                })
                .on('drag', function(d) {
                  that.dragged(d, -1);
                })
                .on('end', function(d) {
                  that.dragended(d, this);
                }));

    this.trustBoundary.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLinkOrBoundary(d, this);
      } else {
        d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
        d3.select(this).classed('selected', true);
        that.onContextMenu(d3.event, {type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.trustBoundary.on('click', function(d, i) {
      d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
      d3.select(this).classed('selected', true);
      that.showProperties({type: that.getStencil(d.stencilId).type, id: d.id, idOfData: d.idOfData});

       // ovo ce prekinuti obradu ovog eventa
       d3.event.preventDefault();
       d3.event.stopPropagation();
    });

    this.trustBoundary.each(function(d: any, i) {
      const self = d3.select(this);

      const stencil = that.getStencil(d.stencilId);

      stencil.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (stencil.tag === 'path') {
            /*if (d.source && d.target) {
              const source = that.getNode(d.source);
              const target = that.getNode(d.target);
              const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(source.position.x + that.SHAPE_SIZE / 2,
                                                                source.position.y + that.SHAPE_SIZE / 2,
                                                                target.position.x + that.SHAPE_SIZE / 2,
                                                                target.position.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              d.points = [
                startPoint,
                // [startPoint[0], startPoint[1] - 10],
                // startPoint,
                // [startPoint[0], startPoint[1] + 10],
                // startPoint,
                { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2},
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                endPoint
                // [endPoint[0], endPoint[1] - 10],
                // endPoint,
                // [endPoint[0], endPoint[1] + 10]
             ];
            }*/

            const pathData = that.lineGenerator(d.points.map(point => [point.x, point. y]));
            self.attr('d', pathData);
      }

    });
    this.trustBoundary = svgCanvas.selectAll(this.selectSvg + ' .trust-boundary');


    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
      const self = d3.select(this);
      let transformAttribute = 'translate(' + that.diagram.graph.translateX + ','
      + that.diagram.graph.translateY + ') scale(' + that.diagram.graph.scale + ')';
      if (self.classed('link-arrows')) {
        const rotate = self.attr('transform');
        if (rotate) {
          transformAttribute += ' ' + rotate;
        }
      }
      return transformAttribute;
    });

    this.doLassoSelect();

    /*// Update and restart the this.simulation.
    this.simulation.nodes(this.diagram.graph.nodes);
    const forceLink: any = this.simulation.force('link');
    forceLink.links(this.diagram.graph.links);
    // this.simulation.alpha(1).restart();
    this.simulation.restart();*/
  }

  rightClickOnLinkOrBoundary(linkOrBoundary: any, linkOrBoundaryThis: any) {
    /*if (d3.event.defaultPrevented) {
      return;
    }*/

    const that = this;
    const circlesOnLinkOrBoundary = d3.select(this.selectSvg).selectAll(' circle.circle-on-link-or-boundary-' + linkOrBoundary.id);

    linkOrBoundary.circleForManipulation.enabled = !linkOrBoundary.circleForManipulation.enabled;

    if (linkOrBoundary.circleForManipulation.enabled) {
      circlesOnLinkOrBoundary.data(linkOrBoundary.points).enter()
          .append('circle')
            .attr('cx', function(d: any) {
              return d.x;
            })
            .attr('cy', function(d: any) {
              return d.y;
            })
            .attr('r', 10)
            .attr('fill', linkOrBoundary.circleForManipulation.color)
            .attr('transform', 'translate(' + that.diagram.graph.translateX + ','
              + that.diagram.graph.translateY + ') scale(' + that.diagram.graph.scale + ')')
            .classed('circle-on-link-or-boundary', true)
            .classed('circle-on-link-or-boundary-' + linkOrBoundary.id, true)
            .classed('zoom-element', true)
            .call(d3.drag()
                    .on('start', function(d) {
                      that.dragstartedForCircleOnLinkOrBoundary(d, linkOrBoundary);
                    })
                    .on('drag', function(d) {
                      that.draggedForCircleOnLinkOrBoundary(d);
                    })
                    .on('end', function(d) {
                      that.dragendedForCircleOnLinkOrBoundary(d, linkOrBoundaryThis, linkOrBoundary);
                    }));
    } else {
      circlesOnLinkOrBoundary.remove();
    }
  }

  clickOnSvg() {
      d3.selectAll(this.selectSvg + ' circle.circle-on-link-or-boundary').remove();
      this.ticked(-1);
  }

  doLassoSelect() {
    const that = this;

    const svgCanvas = d3.select(this.selectSvg);


    // bez ovog ne radi, jer lasso nije video d3.drag() funkciju
    window['d3'] = d3;

    this.d3Lasso = lasso()
        .closePathSelect(true)
        .closePathDistance(100)
        .items(svgCanvas.selectAll('.graphical-element'))
        .targetArea(svgCanvas)
        .on('start', function() {
           that.lassoStart();
        })
        .on('draw', function() {
          that.lassoDraw();
        })
        .on('end', function() {
          that.lassoEnd();
        });

    svgCanvas.call(this.d3Lasso);
  }

  lassoStart() {
    this.d3Lasso.items()
        // .attr('r', 3.5) // reset size
        .classed('not_possible', true)
        .classed('selected', false);
  }

  lassoDraw() {

    // Style the possible dots
    this.d3Lasso.possibleItems()
        .classed('not_possible', false)
        .classed('possible', true);

    // Style the not possible dot
    this.d3Lasso.notPossibleItems()
        .classed('not_possible', true)
        .classed('possible', false);
  }

  lassoEnd() {
    // Reset the color of all dots
    this.d3Lasso.items()
        .classed('not_possible', false)
        .classed('possible', false);

    // Style the selected dots
    this.selectedItems = this.d3Lasso.selectedItems()
        .classed('selected', true);
        // .attr('r', 7);

    this.changedTabChangeSelectedItems();

    // Reset the style of the not selected dots
    // d3Lasso.notSelectedItems()
        // .attr('r', 3.5);
  }

  deselectLasso() {
     // Reset the color of all dots
     this.d3Lasso.items()
     .classed('not_possible', false)
     .classed('possible', false);

    // Style the selected dots
    this.selectedItems = this.d3Lasso.selectedItems()
        .classed('selected', false);
        // .attr('r', 7);

    this.selectedItems = null;
    this.changedTabChangeSelectedItems();
  }

  doZoom(areaForZoom) {
    const that = this;

    this.zoom = d3.zoom()
    .filter(function () {
      return d3.event.ctrlKey; // zoom ce raditi samo ako je pritisnuta CTRL tipka
    })
    .scaleExtent([that.MAX_ZOOM_OUT, that.MAX_ZOOM_IN])
    .on('zoom', function () {
        // console.log(d3.event);
        // simp.attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.diagram.graph.scale + ')');
        // d3.selectAll(that.selectSvg + ' .zoom-element')
            // .each(function(d: any, i) {
        that.diagram.graph.translateX = d3.event.transform.x;
        that.diagram.graph.translateY = d3.event.transform.y;
        that.diagram.graph.scale = d3.event.transform.k;
            // });
        that.ticked(-1);
            /*
            .attr('transform', function(d: any) {
                // d.x = d3.event.transform.x;
                // d.y = d3.event.transform.y;
                that.diagram.graph.scale = d3.event.transform.k;
                return 'translate(' + d3.event.transform.x + ','
                  + d3.event.transform.y + ') scale(' + that.diagram.graph.scale + ')';
            });*/
            /*.attr('id', function(d: any) {
                d.x = d3.event.transform.x;
                d.y = d3.event.transform.y;
                that.diagram.graph.scale = d3.event.transform.k;
                return 'aaa';
            });
            that.ticked();*/
    });

    areaForZoom.call(this.zoom);
    // .append('g');
  }

  /*getIndexForInserNewPoint(points: any[], newPoint: any) {
      let minSumDistance = this.getDistance(points[0], newPoint) + this.getDistance(points[1], newPoint);
      let indexOfSecondPoint = 1;
      let currentSumDistance;
      for (let i = 1; i < points.length - 1; i++) {
          currentSumDistance = this.getDistance(points[i], newPoint)
                            + this.getDistance(points[i + 1], newPoint);
          if (currentSumDistance < minSumDistance) {
              minSumDistance = currentSumDistance;
              indexOfSecondPoint = i + 1;
          }
      }
      return indexOfSecondPoint;
  }*/

  dragstarted(d) {
    if (d3.event.sourceEvent.defaultPrevented) {
      return;
    }

    // Called when drag event starts. It stop the propagation of the click event
    d3.event.sourceEvent.stopPropagation();
    // d.fixed = false;
    // this.simulation.stop(); // stops the force auto positioning before you start dragging
    // this.simulation.restart();
    // this.simulation.alpha(0.7);
    // this.simulation.alpha(0.7);
    // d.fx = d.position.x;
    // d.fy = d.position.y;


    /*if (d.element.tag === 'path') {
      const newPoint = [d3.event.x, d3.event.y];
      if (!d.points.includes(newPoint)) {
        // newPoint ce biti ubacen izmedju neke dve tacke, takve da je zbir rastojanja
        // od newPoint do prve tacke i od newPoint do druge tacke manji od zbira rastojanja
        // do bilo koje druge dve tacke
        const indexOfSecondPoint = this.getIndexForInserNewPoint(d.points, newPoint);
        d.points.splice(indexOfSecondPoint, 0, newPoint);
      }
    }*/
  }

  dragged(d, i) {
    /*if (d3.event.sourceEvent.defaultPrevented) {
      return;
    }*/

    d3.event.sourceEvent.stopPropagation();

    const that = this;

    const stencil = this.getStencil(d.stencilId);
    const type = stencil.type;

    if (type === 'data-flow' || type === 'trust-boundary') {
      d.source = null;
      d.target = null;
      const eventX = (d3.event.x - this.diagram.graph.translateX) / this.diagram.graph.scale;
      // const eventX = d3.event.x;
      const eventY = (d3.event.y - this.diagram.graph.translateY) / this.diagram.graph.scale;
      // const eventY = d3.event.y;

      // const nearestPoint = this.getNearestPoint(d.points, { x: eventX, y: eventY } );
      const nearestPoint = this.getNearestPoint(d.points, { x: eventX, y: eventY } );
      // const dx = d3.event.x - nearestPoint.x;
      const dx = eventX - nearestPoint.x;
      // const dy = d3.event.y - nearestPoint.y;
      const dy = eventY - nearestPoint.y;
      d.points.forEach(point => {
        point.x = point.x + dx;
        point.y = point.y + dy;
      });
    } else {
      let offsetX, offsetY;
      if (stencil.tag === 'rect') {
        offsetX = this.SHAPE_SIZE / 2;
        offsetY = this.SHAPE_SIZE * 3 / 8;
      } else {
        offsetX = this.SHAPE_SIZE / 2;
        offsetY = this.SHAPE_SIZE / 2;
      }

      // oduzimamo pluprecnik da bismo dobili koordinatu gornjeg levog coska
      const newX = (d3.event.x - offsetX - this.diagram.graph.translateX) / this.diagram.graph.scale;
      const dx = newX - d.position.x;
      d.position.x = newX;
      // oduzimamo pluprecnik da bismo dobili koordinatu gornjeg levog coska
      const newY = (d3.event.y - offsetY - this.diagram.graph.translateY) / this.diagram.graph.scale;
      const dy = newY - d.position.y;
      d.position.y = newY;
      this.link.each(function (l: any) {
            if (l.source && l.source === d.id) {
                /*
                const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(source.position.x + that.SHAPE_SIZE / 2,
                                                                  source.position.y + that.SHAPE_SIZE / 2,
                                                                  l.points[0].x,
                                                                  l.points[0].y,
                                                                  that.SHAPE_SIZE / 2);
                const startPoint = startAndEndPoints.start;
                const endPoint = startAndEndPoints.end;

                l.points = [
                    startPoint,
                    [startPoint[0], startPoint[1] - 10],
                    startPoint,
                    [startPoint[0], startPoint[1] + 10],
                    // [d.source.x + that.SHAPE_SIZE / 2, d.source.y + that.SHAPE_SIZE / 2],
                    [(l.source.x + l.target.x) / 2, (l.source.y + l.target.y) / 2],
                    // [d.target.x + that.SHAPE_SIZE / 2, d.target.y + that.SHAPE_SIZE / 2],
                    endPoint,
                    [endPoint[0], endPoint[1] - 10],
                    endPoint,
                    [endPoint[0], endPoint[1] + 10]
                ];*/

                // menjamo prvu i srednju tacku
                if (!that.staticPoints) {
                    const source = that.getNode(l.source);
                    const point = that.getNearestPointOnCircleOrRect(source.position.x + that.SHAPE_SIZE / 2,
                                                              source.position.y + that.SHAPE_SIZE / 2,
                                                              l.points[0].x,
                                                              l.points[0].y,
                                                              that.SHAPE_SIZE / 2);
                    l.points[0].x = point.x;
                    const yDown = source.position.y + that.SHAPE_SIZE * 3 / 4;
                    if (stencil.tag === 'rect' && point.y > yDown) {
                      l.points[0].y = yDown;
                    } else {
                      l.points[0].y = point.y;
                    }
                } else {
                    l.points[0].x = l.points[0].x + dx;
                    l.points[0].y = l.points[0].y + dy;
                }
                l.points[1].x = d3.mean([l.points[0].x, l.points[l.points.length - 1].x]);
                l.points[1].y = d3.mean([l.points[0].y, l.points[l.points.length - 1].y]);
              }

              if (l.target && l.target === d.id) {
                // menjamo poslednju i srednju tacku
                if (!that.staticPoints) {
                    const target = that.getNode(l.target);
                    const point = that.getNearestPointOnCircleOrRect(target.position.x + that.SHAPE_SIZE / 2,
                                                              target.position.y + that.SHAPE_SIZE / 2,
                                                              l.points[l.points.length - 1].x,
                                                              l.points[l.points.length - 1].y,
                                                              that.SHAPE_SIZE / 2);
                    l.points[l.points.length - 1].x = point.x;
                    const yDown = target.position.y + that.SHAPE_SIZE * 3 / 4;
                    if (stencil.tag === 'rect' && point.y > yDown) {
                      l.points[l.points.length - 1].y = yDown;
                    } else {
                      l.points[l.points.length - 1].y = point.y;
                    }
                } else {
                    l.points[l.points.length - 1].x = l.points[l.points.length - 1].x + dx;
                    l.points[l.points.length - 1].y = l.points[l.points.length - 1].y + dy;
                }
                l.points[l.points.length - 2].x = d3.mean([l.points[0].x, l.points[l.points.length - 1].x]);
                l.points[l.points.length - 2].y = d3.mean([l.points[0].y, l.points[l.points.length - 1].y]);
              }
            });
    }

    this.ticked(i);
  }

  dragended(d, thatDraggedElement) {
      const that = this;
      // d.fixed = true;
      // d.fx = null;
      // d.fy = null;

      const type = this.getStencil(d.stencilId).type;

      if (type === 'process' || type === 'complex-process' || type === 'external-entity'
          || type === 'data-store' || type === 'data-flow') {
          let movedLinks: any;
          if (type === 'data-flow') {
              const circles = this.node.data()
                                  .map(el => {
                                    return { x: el.position.x + this.SHAPE_SIZE / 2, y: el.position.y + this.SHAPE_SIZE / 2 };
                                  });

              const nearestPointToLinkStart = this.getNearestPointOnCircleOrRects(circles, d.points[0].x,
                                                                   d.points[0].y, this.SHAPE_SIZE / 2);
              console.log('(nearestPointToLinkStart) Distance : ' + nearestPointToLinkStart.distance);
              if (nearestPointToLinkStart.distance <= 25 ) {
                  d.points[0].x = nearestPointToLinkStart.x;
                  d.points[0].y = nearestPointToLinkStart.y;
                  d.source = that.node.data()[nearestPointToLinkStart.index].id;
              }

              const indexOfLastPoint = d.points.length - 1;
              const nearestPointToLinkEnd = this.getNearestPointOnCircleOrRects(circles,
                    d.points[indexOfLastPoint].x, d.points[indexOfLastPoint].y, this.SHAPE_SIZE / 2);
              console.log('(nearestPointToLinkEnd) Distance : ' + nearestPointToLinkEnd.distance);
              if (nearestPointToLinkEnd.distance <= 25 ) {
                  d.points[indexOfLastPoint].x = nearestPointToLinkEnd.x;
                  d.points[indexOfLastPoint].y = nearestPointToLinkEnd.y;
                  d.target = that.node.data()[nearestPointToLinkEnd.index].id;
              }

              // console.log(this.link.data());
              that.ticked(-1);

              movedLinks = this.link.filter(function(l: any) {
                  return l.id === d.id;
              });
          } else {
              movedLinks = this.link.filter(function(l: any) {
                  return l.source === d.id || l.target === d.id;
              });
            }
          this.checkAndUpdateBoundariesCrossedForMovedLinks(movedLinks);
      } else if (type === 'trust-boundary') {
          that.checkAndUpdateBoundariesCrossed(thatDraggedElement, d);
      } else {
          alert('Not implemented for type: ' + type + '(dragended method)');
      }

      // this.simulation.alpha(0);
      // d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
      // this.ticked();
      // this.simulation.restart();
  }

  checkAndUpdateBoundariesCrossedForMovedLinks(movedLinks: any) {
    const that = this;
    movedLinks.each(function(d: any) {
        const movedLink = that.diagram.flows.filter(f => f.id === d.idOfData)[0];
        movedLink.boundariesCrossed.forEach(boundaryId => {
            const boundary: TrustBoundary = that.diagram.boundaries.filter(b => b.id === boundaryId)[0];
            const index = boundary.links.indexOf(d.idOfData);
            boundary.links.splice(index, 1);
        });
        movedLink.boundariesCrossed = [];

        const movedLinkThis = this;
        that.trustBoundary.each(function(tb: any) {
            const boundaryThis = this;
            const boundary: TrustBoundary = that.diagram.boundaries.filter(b => b.id === tb.idOfData)[0];
            const intersections: any[] = Raphael.pathIntersection(
              d3.select(movedLinkThis).attr('d'),
              d3.select(boundaryThis).attr('d')
            );
            if (intersections.length > 0) {
              movedLink.boundariesCrossed.push(boundary.id);
              boundary.links.push(movedLink.id);
            }
        });
    });
  }

  checkAndUpdateBoundariesCrossed(thatDraggedElement: any, d: any) {
    const currentBoundary = this.diagram.boundaries.filter(b => b.id === d.idOfData)[0];
    currentBoundary.links.forEach(
      linkId => {
        const boundariesCrossed = this.diagram.flows.filter(f => f.id === linkId)[0].boundariesCrossed;
        const index = boundariesCrossed.indexOf(currentBoundary.id);
        boundariesCrossed.splice(index, 1);
      }
    );
    currentBoundary.links = [];

    const that = this;

    this.link.each(function(l: any) {
      const linkThis = this;
      const intersections: any[] = Raphael.pathIntersection(
        d3.select(thatDraggedElement).attr('d'),
        d3.select(linkThis).attr('d')
      );
      if (intersections.length > 0) {
        that.diagram.flows.filter(f => f.id === l.idOfData)[0].boundariesCrossed.push(currentBoundary.id);
        currentBoundary.links.push(l.idOfData);
      }
    });
  }

  dragstartedForCircleOnLinkOrBoundary(d, linkOrBoundary) {
    // Called when drag event starts. It stop the propagation of the click event
    d3.event.sourceEvent.stopPropagation();
    // d.fixed = false;
    // this.simulation.stop(); // stops the force auto positioning before you start dragging
    // this.simulation.restart();
    // this.simulation.alpha(0.7);
    // this.simulation.alpha(0.7);
    if (this.getStencil(linkOrBoundary.stencilId).type === 'data-flow') {
      const indexOfPoint = linkOrBoundary.points.indexOf(d);
      if (indexOfPoint === 0) {
        linkOrBoundary.source = null;
      } else if ( indexOfPoint === linkOrBoundary.points.length - 1) {
        linkOrBoundary.target = null;
      }
    }
    // d.fx = d.x;
    // d.fy = d.y;
  }

  draggedForCircleOnLinkOrBoundary(d: any) {
      d.x = d3.event.x;
      d.y = d3.event.y;

      this.ticked(-1);
  }

  dragendedForCircleOnLinkOrBoundary(d: any, linkOrBoundaryThis: any, linkOrBoundary: any) {
    const that = this;
    // d.fixed = true;
    // d.fx = null;
    // d.fy = null;

    const type = this.getStencil(linkOrBoundary.stencilId).type;
    if (type === 'trust-boundary') {
        this.checkAndUpdateBoundariesCrossed(linkOrBoundaryThis, linkOrBoundary);
    } else if (type === 'data-flow') {
        const circles = this.node.data()
                .map(el => {
                  return { x: el.position.x + this.SHAPE_SIZE / 2, y: el.position.y + this.SHAPE_SIZE / 2 };
                });
        const nearestPoint = this.getNearestPointOnCircleOrRects(circles, d3.event.x, d3.event.y, this.SHAPE_SIZE / 2);
        console.log('Distance: ' + nearestPoint.distance);
        if (nearestPoint.distance <= 25 ) {
            this.link.each(function (el: any) {
                if (el.points[0] === d || el.points[el.points.length - 1] === d) {
                    d.x = nearestPoint.x;
                    d.y = nearestPoint.y;
                    if (el.points[0] === d) {
                        el.source = that.node.data()[nearestPoint.index].id;
                    } else if (el.points[el.points.length - 1] === d) {
                        el.target = that.node.data()[nearestPoint.index].id;
                    }
                    that.ticked(-1);
                    const movedLinks = that.link.filter(function(l: any) {
                        return l.id === el.id;
                    });
                    that.checkAndUpdateBoundariesCrossedForMovedLinks(movedLinks);
                    return;
                }
            });
        }
    }

    // this.simulation.alpha(0);
    // d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
    // this.ticked();
    // this.simulation.restart();
  }

  makeGraph() {
    // const svgCanvasHTML: any = document.querySelector(this.selectSvg);
    // const svgCanvasWidth: number = svgCanvasHTML.clientWidth;
    // const svgCanvasHeight: number = svgCanvasHTML.clientHeight;

    const svgCanvas = d3.select(this.selectSvg);

    /*this.diagram.graph.links.forEach((l: any) => {
      l.source = this.getNode(l.source);
      l.target = this.getNode(l.target);
    });*/

    /*const linkForce  = d3.forceLink(this.diagram.graph.links)
                          // .id(function(d: any) { return d.id; })
                          .distance(this.dist)
                          .strength(2);
                          // .strength(-1000);

    this.simulation = d3.forceSimulation().alpha(0) // .alphaTarget(0.01) // .alpha(0)
                          .force('link', linkForce)
                          .force('charge', d3.forceManyBody());
                          // .force('center', d3.forceCenter(svgCanvasWidth / 2, svgCanvasHeight / 2));
    this.simulation.stop();*/

    const that = this;

    // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
    this.link = svgCanvas.selectAll(this.selectSvg + ' path.link')
              .data(this.diagram.graph.links)
              .enter()
              .append('path')
              .classed('link', true)
              .classed('graphical-element', true)
              .classed('zoom-element', true)
              .style('cursor', 'move')
              .call(d3.drag()
                .on('start', function(d) {
                    that.dragstarted(d);
                })
                .on('drag', function(d) {
                    that.dragged(d, -1);
                })
                .on('end', function(d) {
                    that.dragended(d, this);
                }));

    this.link.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLinkOrBoundary(d, this);
      } else {
        d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
        d3.select(this).classed('selected', true);
        that.onContextMenu(d3.event, {type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.link.on('click', function(d, i) {
        d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
        d3.select(this).classed('selected', true);
        that.showProperties({type: that.getStencil(d.stencilId).type, id: d.id, idOfData: d.idOfData});

        // ovo ce prekinuti obradu ovog eventa
        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    this.link.each(function(d: any, i) {
      const self = d3.select(this);
      const stencil: Stencil = that.getStencil(d.stencilId);

      stencil.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (stencil.tag === 'path') {
            if (d.source && d.target && !that.staticPoints) {
              const source = that.getNode(d.source);
              const target = that.getNode(d.target);
              const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(source.position.x + that.SHAPE_SIZE / 2,
                                                                source.position.y + that.SHAPE_SIZE / 2,
                                                                target.position.x + that.SHAPE_SIZE / 2,
                                                                target.position.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              d.points = [
                startPoint,
                // [startPoint[0], startPoint[1] - 10],
                // startPoint,
                // [startPoint[0], startPoint[1] + 10],
                // startPoint,
                { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2 },
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                // endPoint,
                // [endPoint[0], endPoint[1] - 10],
                // endPoint,
                // [endPoint[0], endPoint[1] + 10],
                endPoint
             ];
            }

            const pathData = that.lineGenerator(d.points.map(point => [point.x, point. y]));
            self.attr('d', pathData);
      }

    });
    this.link = svgCanvas.selectAll(this.selectSvg + ' .link');

    /*const triangle = d3.symbol()
            .type(d3.symbolTriangle)
            .size(150);

    this.linkArrow = svgCanvas.selectAll(this.selectSvg + ' path.link-arrows')
              .data(this.diagram.graph.links.filter(l => l.target)) // ostaju samo oni koji imaju definisan target
              .enter()
              .append('path')
              .attr('d', triangle)
              .attr('transform', function(d) {
                const point = d.points[d.points.length - 1];
                return 'translate(' + point.x + ',' + point.y + ') scale(' + that.diagram.graph.scale + ')'; })
              .style('fill', '#585858')
              .classed('link-arrows', true)
              .classed('zoom-element', true);*/

    // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
    this.diagram.graph.nodes
      .filter(n => this.getStencil(n.stencilId).tag === 'image')
      .forEach(n => {
        const imagePath = this.getStencil(n.stencilId).properties.filter(prop => prop.name === 'xlink:href')[0].value;
        if (!this.imagesMap.has(imagePath)) {
          const patternId = 'id-pattern-image-' + this.patternImageGenerator++;
          this.imagesMap.set(imagePath, patternId);

          svgCanvas.select('defs')
                  .append('pattern')
                    .attr('id', patternId)
                    .attr('patternUnits', 'objectBoundingBox')
                    .attr('height', this.SHAPE_SIZE)
                    .attr('width', this.SHAPE_SIZE)
                    .append('image')
                      .attr('x', 0)
                      .attr('y', 0)
                      .attr('height', this.SHAPE_SIZE)
                      .attr('width', this.SHAPE_SIZE)
                      .attr('xlink:href', imagePath);
        }
      });

    this.gNode = svgCanvas.selectAll(this.selectSvg + ' g.g-node').data(this.diagram.graph.nodes)
    .enter()
    .append('g')
    .classed('g-node', true)
    .each(function(d: any, i) {
      const stencil: Stencil = that.getStencil(d.stencilId);
      const self = d3.select(this);
      const nodeElement = self.append(() => {
          let tagName;
          if (stencil.tag === 'image') {
            tagName = 'circle';
          } else {
            tagName = stencil.tag;
          }
          // return document.createElement(tagName);
          // bez SVG_NAMESPACE kreira elemente u DOM stablu, ali iz nekog razloga ne budu vidljivi
          return document.createElementNS(that.SVG_NAMESPACE, tagName);
        }
      )
      .classed('shape', true)
      .classed('graphical-element', true)
      .classed('zoom-element', true)
      .classed('node', true)
      .style('cursor', 'move')
      .call(d3.drag()
      .on('start', function() {
        that.dragstarted(d);
      })
      .on('drag', function() {
        that.dragged(d, i);
      })
      .on('end', function() {
        that.dragended(d, this);
      }));

      let shape: string;
      if (stencil.tag === 'circle' || stencil.tag === 'image') {
        nodeElement.attr('r', that.SHAPE_SIZE / 2)
            .attr('cx', d.position.x + that.SHAPE_SIZE / 2)
            .attr('cy', d.position.y + that.SHAPE_SIZE / 2);

        if (stencil.tag === 'circle') {
          stencil.properties.forEach(prop => {
            nodeElement.attr(prop.name, prop.value);
            });
        } else if (stencil.tag === 'image') {
          const imagePath = stencil.properties.filter(prop => prop.name === 'xlink:href')[0].value;
          nodeElement.attr('fill', 'url(#' + that.imagesMap.get(imagePath) + ')');
        }
        shape = 'circle';
      } else if (stencil.tag === 'rect') {
        nodeElement
            .attr('x', d.position.x)
            .attr('y', d.position.y)
            .attr('width', that.SHAPE_SIZE)
            .attr('height', that.SHAPE_SIZE * 3 / 4)
            .attr('stroke-dasharray', `${that.SHAPE_SIZE} ${that.SHAPE_SIZE * 3 / 4} ${that.SHAPE_SIZE} ${that.SHAPE_SIZE * 3 / 4}`);
        stencil.properties.forEach(prop => {
          nodeElement.attr(prop.name, prop.value);
        });
        shape = 'square';
      }

      const name = that.getGraphicElement(d.idOfData, stencil.type).name;

      nodeElement.append('title')
                  .text(name);

      let textColor: string;
      if (stencil.type === 'complex-process' || stencil.type === 'data-store') {
          textColor = 'green';
      } else {
          textColor = 'white';
      }

      self.append('text')
          // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
          // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
          // .attr('text-anchor', 'middle')
          .attr('font-size', that.TEXT_SIZE)
          .attr('font-family', 'sans-serif')
          .attr('fill', textColor)
          .attr('id', that.idSvg + '_id_text' + i)
          // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')
          .text(name)
          .classed('wrap', true)
          .classed('node-text', true)
          .classed('zoom-element', true);
      // text.append('title').text(name);

      d3plus.textwrap()
          // .config(that.nodeTextConfig)
          .container('#' + that.idSvg + '_id_text' + i)
          // .resize(true)
          .shape(shape)
          .padding(10)
          // .align('middle')
          .valign('middle')
          .draw();
    });

    this.gNode = svgCanvas.selectAll(this.selectSvg + ' g.g-node');
    this.nodeText = svgCanvas.selectAll(this.selectSvg + ' .node-text');
    this.node = svgCanvas.selectAll(this.selectSvg + ' .node');

    this.node.on('contextmenu', function(d: any, i) {
      d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
      d3.select(this).classed('selected', true);
      that.onContextMenu(d3.event, {type: that.getStencil(d.stencilId).type, id: d.id});

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.node.on('click', function(d, i) {
        if (d3.event.defaultPrevented) {
          return;
        }

        d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
        d3.select(this).classed('selected', true);
        that.selectedItems = that.node.filter(function(n: any) {
          return n.id === d.id;
        });
        that.changedTabChangeSelectedItems();
        that.showProperties({type: that.getStencil(d.stencilId).type, id: d.id, idOfData: d.idOfData});

        // ovo ce prekinuti obradu ovog eventa
        d3.event.preventDefault();
        d3.event.stopPropagation();
    });


    this.linkArrow = svgCanvas.selectAll(this.selectSvg + ' path.link-arrows')
              .data(this.diagram.graph.links)
              .enter()
              .append('path')
              .attr('stroke', '#ffa500')
              .attr('stroke-width', 5)
              // .attr('fill', 'none')
              .attr('fill', '#ffa500')
              .classed('link-arrows', true)
              .classed('zoom-element', true)
              .each(function(d: any, i) {
                const self = d3.select(this);
                const endPoint = d.points[d.points.length - 1];
                let offset = 0;

                const points = [ // formiramo trougao
                  [endPoint.x, endPoint.y + 10],
                  [endPoint.x + 10, endPoint.y],
                  [endPoint.x, endPoint.y - 10],
                  [endPoint.x, endPoint.y + 10]
                ];

                const pathData = that.lineGenerator(points);
                self.attr('d', pathData);

                let angle = 0;
                if (d.target && !that.staticPoints) {
                  const target = that.getNode(d.target);
                  const point = { x: target.position.x + that.SHAPE_SIZE / 2, y: target.position.y + that.SHAPE_SIZE / 2 };
                  if (point.x >= endPoint.x) {
                      offset = 0;
                  } else {
                      offset = 180;
                  }
                  angle = that.getAngleForRotating(point, endPoint, offset);
                } else {
                  const transform = self.attr('transform').trim();
                  if (transform && transform.includes('rotate')) {
                    const tokens: string[] = transform.split(' ');
                    angle = +tokens[2].replace('rotate(', '').replace(')', '');
                  }
                }

                console.log('angle: ' + angle);
                const firstThreePoints = points.slice(0, points.length - 1);
                const xMean = d3.mean(firstThreePoints.map(p => p[0]));
                const yMean = d3.mean(firstThreePoints.map(p => p[1]));
                // xMean i yMean predstavljaju koordinate tacke (teziste) oko koje cemo rotirati strelice (trouglove)
                self.attr('transform', `rotate(${angle + ' ' + xMean + ' ' + yMean})`);
                // self.attr('transform-origin', xMean + ' ' + yMean);
                // }
              });
              /*.attr('transform', function(d) {
                const point = d.points[d.points.length - 1];
                return 'translate(' + point.x + ',' + point.y + ') scale(' + that.diagram.graph.scale + ')'; })*/

    this.linkText = svgCanvas.selectAll(this.selectSvg + ' text.link-text')
              .data(this.diagram.graph.links)
              .enter()
              .append('text')
              .attr('x', function(d: any) {
                  return d.points[1].x + 10;
                  // return d3.mean(d.points.map(point => point[0]));
              })
              .attr('y', function(d: any) {
                  return d.points[1].y;
                  // return d3.mean(d.points.map(point => point[1]));
              })
              // .attr('text-anchor', 'middle')
              .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'white')
              .attr('filter', 'url(#' + that.idSvg + '_id_yellow_color)')
              .text(function(d: any) {
                  return that.getGraphicElement(d.idOfData, 'data-flow').name;
              })
              .classed('link-text', true)
              .classed('zoom-element', true);

      // ovde je bio node

    this.trustBoundary = svgCanvas.selectAll(this.selectSvg + ' path.trust-boundary')
              .data(this.diagram.graph.boundaries)
              .enter()
              .append('path')
              .classed('trust-boundary', true)
              .classed('graphical-element', true)
              .classed('zoom-element', true)
              .style('cursor', 'move')
              .call(d3.drag()
                .on('start', function(d) {
                    that.dragstarted(d);
                })
                .on('drag', function(d) {
                    that.dragged(d, -1);
                })
                .on('end', function(d) {
                    that.dragended(d, this);
                }));

    this.trustBoundary.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLinkOrBoundary(d, this);
      } else {
        d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
        d3.select(this).classed('selected', true);
        that.onContextMenu(d3.event, {type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.trustBoundary.on('click', function(d, i) {
      d3.selectAll(that.selectSvg + ' .selected').classed('selected', false);
      d3.select(this).classed('selected', true);
      that.showProperties({type: that.getStencil(d.stencilId).type, id: d.id, idOfData: d.idOfData});

        // ovo ce prekinuti obradu ovog eventa
        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    this.trustBoundary.each(function(d: any, i) {
      const self = d3.select(this);
      const stencil: Stencil = that.getStencil(d.stencilId);

      stencil.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (stencil.tag === 'path') {
            if (d.source && d.target) {
              const source = that.getNode(d.source);
              const target = that.getNode(d.target);
              const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(source.position.x + that.SHAPE_SIZE / 2,
                                                                source.position.y + that.SHAPE_SIZE / 2,
                                                                target.position.x + that.SHAPE_SIZE / 2,
                                                                target.position.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              d.points = [
                startPoint,
                // [startPoint[0], startPoint[1] - 10],
                // startPoint,
                // [startPoint[0], startPoint[1] + 10],
                // startPoint,
                { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2 },
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                // endPoint,
                // [endPoint[0], endPoint[1] - 10],
                // endPoint,
                // [endPoint[0], endPoint[1] + 10],
                endPoint
             ];
            }

            const pathData = that.lineGenerator(d.points.map(point => [point.x, point. y]));
            self.attr('d', pathData);
      }

    });
    this.trustBoundary = svgCanvas.selectAll(this.selectSvg + ' .trust-boundary');

    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
      const self = d3.select(this);
      let transformAttribute = 'translate(' + that.diagram.graph.translateX + ','
      + that.diagram.graph.translateY + ') scale(' + that.diagram.graph.scale + ')';
      if (self.classed('link-arrows')) {
        const rotate = self.attr('transform');
        if (rotate) {
          transformAttribute += ' ' + rotate;
        }
      }
      return transformAttribute;
    });

    /*d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
      return 'translate(' + that.diagram.graph.translateX + ','
        + that.diagram.graph.translateY + ') scale(' + that.diagram.graph.scale + ')';
    });*/

    /*
    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
        const self = d3.select(this);
        let x = that.diagram.graph.translateX;
        let y = that.diagram.graph.translateY;

        if (self.classed('link-arrows')) {
          const data: any = self.data()[0];
          const point = data.points[data.points.length - 1];
          x += point.x;
          y += point.y;
        }
        return 'translate(' + x + ','
          + y + ') scale(' + that.diagram.graph.scale + ')';
    });
    */

    /*this.simulation
      .on('tick', function() {
        that.ticked();
      })
      .on('end', function() {
        that.ticked();
      });*/
  }

  radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  getAngleForRotating(centerOrStartPoint: Point, pointOnCircle: Point, offset: number) {
    const hypotenuse = this.getDistance(centerOrStartPoint, pointOnCircle); // this.SHAPE_SIZE / 2;
    const cos = Math.abs(centerOrStartPoint.x - pointOnCircle.x) / hypotenuse;
    const angle = Math.acos(cos);
    let coef;
    if (centerOrStartPoint.x >= pointOnCircle.x) {
      if (centerOrStartPoint.y >= pointOnCircle.y) {
        coef = 1;
      } else {
        coef = -1;
      }
    } else {
      if (centerOrStartPoint.y >= pointOnCircle.y) {
        coef = -1;
      } else {
        coef = 1;
      }
    }

    let radiansAngle = this.radiansToDegrees(angle);
    if (radiansAngle >= 0) {
      radiansAngle += offset;
    } else {
      radiansAngle -= offset;
    }
    return coef * radiansAngle;
  }

  getNode(id: string) {
    const filtered = this.diagram.graph.nodes.filter(n => n.id === id);
    if (filtered.length > 0) {
      return filtered[0];
    } else {
      return null;
    }
  }

  dist(d) {
    return d.distance + 30;
  }

  ticked(indexOfNodeText) {
    const that = this;

    this.link.each(function(d: any, i) {
        const pathData = that.lineGenerator(d.points.map(point => [point.x, point. y]));
        const self = d3.select(this);
        self.attr('d', pathData);

        d3.selectAll(that.selectSvg + ' circle.circle-on-link-or-boundary-' + d.id)
              .attr('cx', function(point: any) {
                 return point.x;
              })
              .attr('cy', function(point: any) {
                return point.y;
              });
    });

    this.trustBoundary.each(function(d: any, i) {
        const pathData = that.lineGenerator(d.points.map(point => [point.x, point. y]));
        const self = d3.select(this);
        self.attr('d', pathData);

        d3.selectAll(that.selectSvg + ' circle.circle-on-link-or-boundary-' + d.id)
              .attr('cx', function(point: any) {
                return point.x;
              })
              .attr('cy', function(point: any) {
                return point.y;
              });
    });

    this.linkText
        .attr('x', function(d: any) {
            return d.points[1].x + 10;
            // return d3.mean(d.points.map(point => point[0]));
        })
        .attr('y', function(d: any) {
            return d.points[1].y;
            // return d3.mean(d.points.map(point => point[1]));
        });

    this.node.each(function(d: any) {
        const self = d3.select(this);
        /*if (d.element.tag === 'image') {
          self.attr('x', function(el: any) { return el.x; })
              .attr('y', function(el: any) { return el.y; });
        }*/
        const stencil: Stencil = that.getStencil(d.stencilId);
        if (stencil.tag === 'circle' || stencil.tag === 'image') {
          /*self.attr('transform', function(el: any) {
            return 'translate(' + (el.position.x - +self.attr('cx') + that.diagram.graph.translateX) + ','
            + (el.position.y - +self.attr('cy') + that.diagram.graph.translateY) + ') scale(' + that.diagram.graph.scale + ')';
          });*/
          /*self.attr('cx', function(el: any) { return el.position.x + that.SHAPE_SIZE / 2 + that.diagram.graph.translateX; })
              .attr('cy', function(el: any) { return el.position.y + that.SHAPE_SIZE / 2 + that.diagram.graph.translateY; });*/
          self.attr('cx', function(el: any) { return el.position.x + that.SHAPE_SIZE / 2; })
              .attr('cy', function(el: any) { return el.position.y + that.SHAPE_SIZE / 2; });
        } else if (stencil.tag === 'rect') {
          self.attr('x', function(el: any) { return el.position.x; })
              .attr('y', function(el: any) { return el.position.y; });
        } else {
          alert('Not implemented for stencil tag: ' + stencil.tag + '(ticked method)');
        }
    });

    /*this.nodeText.attr('x', function(d: any) { return d.position.x; })
              .attr('y', function(d: any) { return d.position.y; });
    */

    if (indexOfNodeText >= 0) {
      const svgCanvas = d3.select(this.selectSvg);
      svgCanvas.selectAll(this.selectSvg + ' g.g-node')
                .each(function(d: any, i) {
                  if (i === indexOfNodeText) {
                    const stencil: Stencil = that.getStencil(d.stencilId);
                    let shape: string;
                    if (stencil.tag === 'circle' || stencil.tag === 'image') {
                      shape = 'circle';
                    } else {
                      shape = 'square';
                    }
                    const name = that.getGraphicElement(d.idOfData, stencil.type).name;

                    const self = d3.select(this);

                    self.select('.node title').text(name);

                    let textColor: string;
                    if (stencil.type === 'complex-process' || stencil.type === 'data-store') {
                        textColor = 'green';
                    } else {
                        textColor = 'white';
                    }

                    self.select('text').remove();
                    self.append('text')
                        // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
                        // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
                        // .attr('text-anchor', 'middle')
                        .attr('font-size', that.TEXT_SIZE)
                        .attr('font-family', 'sans-serif')
                        .attr('fill', textColor)
                        .attr('id', that.idSvg + '_id_text' + i)
                        // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')
                        .text(name)
                        .classed('wrap', true)
                        .classed('node-text', true)
                        .classed('zoom-element', true);

                    that.nodeTextConfig.resize = false;

                    d3plus.textwrap()
                        // .config(that.nodeTextConfig)
                        .container('#' + that.idSvg + '_id_text' + i)
                        // .resize(true)
                        .shape(shape)
                        .padding(10)
                        // .align('middle')
                        .valign('middle')
                        .draw();

                    that.nodeTextConfig.resize = true;
                  }
                });
      this.nodeText = svgCanvas.selectAll(this.selectSvg + ' .node-text');
    }

    this.linkArrow.each(function(d: any, i) {
      const self = d3.select(this);
      const endPoint = d.points[d.points.length - 1];
      let offset = 0;

      const points = [ // formiramo trougao
        [endPoint.x, endPoint.y + 10],
        [endPoint.x + 10, endPoint.y],
        [endPoint.x, endPoint.y - 10],
        [endPoint.x, endPoint.y + 10]
      ];

      const pathData = that.lineGenerator(points);
      self.attr('d', pathData);

      let angle = 0;
      if (d.target && !that.staticPoints) {
        const target = that.getNode(d.target);
        const point = { x: target.position.x + that.SHAPE_SIZE / 2, y: target.position.y + that.SHAPE_SIZE / 2 };
        if (point.x >= endPoint.x) {
            offset = 0;
        } else {
            offset = 180;
        }
        angle = that.getAngleForRotating(point, endPoint, offset);
      } else {
        const transform = self.attr('transform').trim();
        if (transform && transform.includes('rotate')) {
          const tokens: string[] = transform.split(' ');
          angle = +tokens[2].replace('rotate(', '').replace(')', '');
        }
      }

      console.log('angle: ' + angle);
      const firstThreePoints = points.slice(0, points.length - 1);
      const xMean = d3.mean(firstThreePoints.map(p => p[0]));
      const yMean = d3.mean(firstThreePoints.map(p => p[1]));
      // xMean i yMean predstavljaju koordinate tacke (teziste) oko koje cemo rotirati strelice (trouglove)
      self.attr('transform', `rotate(${angle + ' ' + xMean + ' ' + yMean})`);
      // self.attr('transform-origin', xMean + ' ' + yMean);
      // }
    });

    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
      const self = d3.select(this);
      let transformAttribute = 'translate(' + that.diagram.graph.translateX + ','
      + that.diagram.graph.translateY + ') scale(' + that.diagram.graph.scale + ')';
      if (self.classed('link-arrows')) {
        const rotate = self.attr('transform');
        if (rotate) {
          transformAttribute += ' ' + rotate;
        }
      }
      return transformAttribute;
    });

    /*
    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
        const self = d3.select(this);
        let x = that.diagram.graph.translateX;
        let y = that.diagram.graph.translateY;

        if (self.classed('link-arrows')) {
          const data: any = self.data()[0];
          const point = data.points[data.points.length - 1];
          x += point.x;
          y += point.y;
        }
        return 'translate(' + that.diagram.graph.translateX + ','
          + that.diagram.graph.translateY + ') scale(' + that.diagram.graph.scale + ')';
    });
    */
  }

  getStartAndEndPointsForLinkOnCircle(x1: number, y1: number, x2: number, y2: number, r: number) {
    const z: number = Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    // const a1: number = r * Math.abs(y1 - y2) / z;
    const a2: number = r * Math.abs(x1 - x2) / z;
    // const b1: number = Math.sqrt( Math.pow(r, 2) - Math.pow(a1, 2));
    const b2: number = Math.sqrt( Math.pow(r, 2) - Math.pow(a2, 2));

    let xStart: number;
    if (x1 > x2) {
      xStart = x1 - a2;
    } else if (x1 < x2) {
      xStart = x1 + a2;
    } else {
      xStart = x1;
    }

    let yStart: number;
    if (y1 > y2) {
      yStart = y1 - b2;
    } else if (y1 < y2) {
      yStart = y1 + b2;
    } else {
      yStart = y1;
    }

    let xEnd: number;
    if (x2 > x1) {
      xEnd = x2 - a2;
    } else if (x2 < x1) {
      xEnd = x2 + a2;
    } else {
      xEnd = x2;
    }

    let yEnd: number;
    if (y2 > y1) {
      yEnd = y2 - b2;
    } else if (y2 < y1) {
      yEnd = y2 + b2;
    } else {
      yEnd = y2;
    }

    return {start: { x: xStart, y: yStart},  end: { x: xEnd, y: yEnd}};
  }

  getNearestPointOnCircleOrRect(x1: number, y1: number, x2: number, y2: number, r: number) {
    // x1 = x1 + this.diagram.graph.translateX;
    // y2 = x1 + this.diagram.graph.translateY;
    // x2 = x2 + this.diagram.graph.translateX;
    // y2 = y2 + this.diagram.graph.translateY;

    let xNearest: number;
    let yNearest: number;
    let z: number;
    // let a1: number;
    // let b1: number;
    let a2: number;
    let b2: number;

    // d3.selectAll(this.selectSvg + ' .brisanje').remove();

    z = Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    // a1 = r * Math.abs(y1 - y2) / z;
    // b1 = Math.sqrt( Math.pow(r, 2) - Math.pow(a1, 2));
    a2 = r * Math.abs(x1 - x2) / z;
    b2 = Math.sqrt( Math.pow(r, 2) - Math.pow(a2, 2));

    if (x1 > x2) {
      xNearest = x1 - a2;
    } else if (x1 < x2) {
      xNearest = x1 + a2;
    } else {
      xNearest = x1;
    }

    if (y1 > y2) {
      yNearest = y1 - b2;
    } else if (y1 < y2) {
      yNearest = y1 + b2;
    } else {
      yNearest = y1;
    }

    /*d3.select(this.selectSvg).append('circle')
              .attr('cx', xNearest)
              .attr('cy', yNearest)
              .attr('r', 3)
              .classed('brisanje', true);*/

    return {x: xNearest, y: yNearest};
  }

  getNearestPointOnCircleOrRects(circles: any[], x2: number, y2: number, r: number) {
    // x2 = x2 + this.diagram.graph.translateX;
    // y2 = x2 + this.diagram.graph.translateY;

    let x1;
    let y1;
    let xNearest: number;
    let yNearest: number;
    let xCurrentNearest: number;
    let yCurrentNearest: number;
    let z: number;
    // let a1: number;
    // let b1: number;
    let a2: number;
    let b2: number;
    let distance;
    let minDistance;
    let index;

    // d3.selectAll(this.selectSvg + ' .brisanje').remove();

    // x1 = circles[0][0] + this.diagram.graph.translateX;
    // y1 = circles[0][1] + this.diagram.graph.translateY;
    x1 = circles[0].x;
    y1 = circles[0].y;
    z = Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    // a1 = r * Math.abs(y1 - y2) / z;
    // b1 = Math.sqrt( Math.pow(r, 2) - Math.pow(a1, 2));
    a2 = r * Math.abs(x1 - x2) / z;
    b2 = Math.sqrt( Math.pow(r, 2) - Math.pow(a2, 2));

    if (x1 > x2) {
      xNearest = x1 - a2;
    } else if (x1 < x2) {
      xNearest = x1 + a2;
    } else {
      xNearest = x1;
    }

    if (y1 > y2) {
      yNearest = y1 - b2;
    } else if (y1 < y2) {
      yNearest = y1 + b2;
    } else {
      yNearest = y1;
    }

    index = 0;

    /*d3.select(this.selectSvg).append('circle')
              .attr('cx', xNearest)
              .attr('cy', yNearest)
              .attr('r', 3)
              .classed('brisanje', true);*/

    minDistance = this.getDistance({ x: xNearest, y: yNearest }, { x: x2, y: y2 });

    circles = circles.slice(1);
    circles.forEach((c, i) => {
        // x1 = c[0] + this.diagram.graph.translateX;
        // y1 = c[1] + this.diagram.graph.translateY;
        x1 = c.x;
        y1 = c.y;
        z = Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        // a1 = r * Math.abs(y1 - y2) / z;
        // b1 = Math.sqrt( Math.pow(r, 2) - Math.pow(a1, 2));
        a2 = r * Math.abs(x1 - x2) / z;
        b2 = Math.sqrt( Math.pow(r, 2) - Math.pow(a2, 2));

        if (x1 > x2) {
          xCurrentNearest = x1 - a2;
        } else if (x1 < x2) {
          xCurrentNearest = x1 + a2;
        } else {
          xCurrentNearest = x1;
        }

        if (y1 > y2) {
          yCurrentNearest = y1 - b2;
        } else if (y1 < y2) {
          yCurrentNearest = y1 + b2;
        } else {
          yCurrentNearest = y1;
        }

        /*d3.select(this.selectSvg).append('circle')
              .attr('cx', xCurrentNearest)
              .attr('cy', yCurrentNearest)
              .attr('r', 3)
              .classed('brisanje', true);*/

        distance = this.getDistance({ x: xCurrentNearest, y: yCurrentNearest}, { x: x2, y: y2 });
        if (distance < minDistance) {
          minDistance = distance;
          xNearest = xCurrentNearest;
          yNearest = yCurrentNearest;
          index = i + 1; // zato sto smo slice-ovali nulti element, pa iteriramo od prvog
        }
    });

    return {x: xNearest, y: yNearest, distance: minDistance, index: index};
  }

  getNearestPoint(points: Point[], point: Point) {
    // u ovoj metodi vodjeno je racuna da li su tacke translirane,
    // ali ne i da li su skalirane (zoom i zoomOut)

    let nearestPoint = points[0];
    let minDistance: number = this.getDistance(points[0], point);

    points = points.slice(1);
    points.forEach(p => {
        const distance: number = this.getDistance(p, point);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = p;
        }
    });

    return nearestPoint;
  }

  getDistance(p1: Point, p2: Point) {
    return Math.sqrt( Math.pow(p1.x - p2.x, 2)
                    + Math.pow(p1.y - p2.y, 2));
  }

  getGraphicElement(idOfData: string, type: string) {
    if (type === 'process' || type === 'complex-process' || type === 'external-entity' || type === 'data-store') {
      return this.diagram.elements.filter(e => e.id === idOfData)[0];
    } else if (type === 'data-flow') {
      return this.diagram.flows.filter(f => f.id === idOfData)[0];
    } else if (type === 'trust-boundary') {
      return this.diagram.boundaries.filter(f => f.id === idOfData)[0];
    } else {
      alert('Not implemented for type: ' + type + '(getGraphicElementName method)');
      return null;
    }
  }

  getStencil(id: string) {
      return this.stencils.filter(s => s.id === id)[0];
  }

  showProperties(typeAndIdOfDataAndId: any) {
    let obj = null;
    if (typeAndIdOfDataAndId.type === 'process' || typeAndIdOfDataAndId.type === 'complex-process'
    || typeAndIdOfDataAndId.type === 'external-entity' || typeAndIdOfDataAndId.type === 'data-store') {
        obj = this.diagram.elements.filter(e => e.id === typeAndIdOfDataAndId.idOfData)[0];
    } else if (typeAndIdOfDataAndId.type === 'data-flow') {
      obj = this.diagram.flows.filter(f => f.id === typeAndIdOfDataAndId.idOfData)[0];
    }  else if (typeAndIdOfDataAndId.type === 'trust-boundary') {
      obj = this.diagram.boundaries.filter(t => t.id === typeAndIdOfDataAndId.idOfData)[0];
    } else {
      alert('Not implented for type: ' + typeAndIdOfDataAndId.type + ' (this.link.onClick method)');
    }

    this.propertiesService.setSelectedElement(
      {
        graphicElement: {
          id: typeAndIdOfDataAndId.id,
          type: typeAndIdOfDataAndId.type
        },
        data: obj
      }
    );
  }

}
