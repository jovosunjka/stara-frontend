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
import { Base } from 'src/app/shared/model/base';
import { TrustBoundary } from 'src/app/shared/model/trust-boundary';

// u fajlu angular.json, u atribut scripts ubaceno je: "node_modules/d3plus/d3plus.full.min.js"
declare const d3plus: any;


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
  private TEXT_SIZE = 10;


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
        } else if (action.type === 'changed-tab') {
          this.changedTabChangeSelectedItems();
        } else if (action.type === 'zoom-out') {
            this.zoomOut();
        }
      }
    );

    // dodajemo svoj eventEmitterName u mapu svih eventEmitter-a
    this.propertiesService.addEventEmitterName(this.diagram.id);

    this.propertiesService.getEventEmitter(this.diagram.id).subscribe(
      (setSelectedElementId: string) => {
        this.gNode.each(function(d, i) {
          if (d.idOfData === setSelectedElementId) {
            const self = d3.select(this);
            self.select('text').remove();
            self.append('text')
                // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
                // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
                // .attr('text-anchor', 'middle')
                // .attr('font-size', that.TEXT_SIZE)
                .attr('font-family', 'sans-serif')
                .attr('fill', 'white')
                .attr('id', that.idSvg + '_id_text' + i)
                // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')
                .text(that.getGraphicElement(setSelectedElementId, 'node').name)
                .classed('wrap', true)
                .classed('node-text', true)
                .classed('zoom-element', true);

            that.nodeTextConfig.resize = true;

            d3plus.textwrap()
                .config(that.nodeTextConfig)
                .container('#' + that.idSvg + '_id_text' + i)
                .shape('circle')
                .padding(10)
                // .align('middle')
                .valign('middle')
                .draw();
          }
        });
      }
    );

    const that = this;
    d3.select(this.selectSvg).on('click', function () {
      that.clickOnSvg();
    });
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
      } else if (graphicElementForRemoving.type === 'process'
                || graphicElementForRemoving.type === 'complex-process') {
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

              if (link.target && (link.target as GraphicElement).id === graphNode.id) {
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
      const newTrustBoundary: TrustBoundary =  {
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
    } else if (type === 'complex-process' || type === 'process' || type === 'external-entity') {
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
          name: 'Trust boundary ' + len
        };
        this.diagram.boundaries.push(newBoundaryData);
        break;

      case 'external-entity':
        len = this.diagram.elements.length;
        idOfData = this.diagram.id + '_id-element-' + len;
        const newExternalENtityData = {
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
        this.diagram.elements.push(newExternalENtityData);
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
                  that.dragended(d);
                }));

    this.link.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLink(d);
      } else {
        that.onContextMenu(d3.event, {name: that.getGraphicElement(d.idOfData, 'link').name,
                                      type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.link.on('click', function(d, i) {
      that.clickOnElement(d);

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
                //[endPoint[0], endPoint[1] - 10],
                //endPoint,
                //[endPoint[0], endPoint[1] + 10]
             ];
            }*/

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

    this.nodeTextConfig.resize = false;

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
            that.dragended(d);
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
                .attr('height', that.SHAPE_SIZE * 3 / 4);
            stencil.properties.forEach(prop => {
              nodeElement.attr(prop.name, prop.value);
            });
            shape = 'square';
          }

          const name = that.getGraphicElement(d.idOfData, 'node').name;
          self.append('text')
              // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
              // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
              // .attr('text-anchor', 'middle')
              // .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'white')
              .attr('id', that.idSvg + '_id_text' + i)
              // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')
              .text(name)
              .classed('wrap', true)
              .classed('node-text', true)
              .classed('zoom-element', true);

          d3plus.textwrap()
              .config(that.nodeTextConfig)
              .container('#' + that.idSvg + '_id_text' + i)
              .shape(shape)
              .padding(10)
              // .align('middle')
              .valign('middle')
              .draw();
        });

    this.nodeTextConfig.resize = true;

    this.gNode = svgCanvas.selectAll(this.selectSvg + ' g.g-node');
    this.nodeText = svgCanvas.selectAll(this.selectSvg + ' .node-text');
    this.node = svgCanvas.selectAll(this.selectSvg + ' .node');

    this.node.on('contextmenu', function(d: any, i) {
      that.onContextMenu(d3.event, {name: that.getGraphicElement(d.idOfData, 'node').name,
                                    type: that.getStencil(d.stencilId).type, id: d.id});

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.node.on('click', function(d, i) {
      that.clickOnElement(d);

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

                  let a;
                  let point;

                  if (d.target) {
                    const target = that.getNode(d.target);
                    point = { x: target.position.x + that.SHAPE_SIZE / 2, y: target.position.y + that.SHAPE_SIZE / 2 };
                  } else {
                      point = d.points[0];
                  }

                  if (!self.attr('transform')) {
                      a = 10;
                  } else {
                    if (point.x >= endPoint.x) {
                        a = 10;
                    } else {
                        a = -10;
                    }
                  }

                  const points = [ // formiramo trougao
                    [endPoint.x, endPoint.y + 10],
                    [endPoint.x + a, endPoint.y],
                    [endPoint.x, endPoint.y - 10],
                    [endPoint.x, endPoint.y + 10]
                  ];

                  const pathData = that.lineGenerator(points);
                  self.attr('d', pathData);

                  if (d.target) {
                    const angle = that.getAngleForRotating(point, endPoint);
                    console.log('angle: ' + angle);
                    const firstThreePoints = points.slice(0, points.length - 1);
                    const xMean = d3.mean(firstThreePoints.map(p => p[0]));
                    const yMean = d3.mean(firstThreePoints.map(p => p[1]));
                    // xMean i yMean predstavljaju koordinate tacke (teziste) oko koje cemo rotirati strelice (trouglove)
                    self.attr('transform', `rotate(${angle + ' ' + xMean + ' ' + yMean})`);
                    // self.attr('transform-origin', xMean + ' ' + yMean);
                  }
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
              .attr('font-size', that.TEXT_SIZE * 3 / 2)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'white')
              .attr('filter', 'url(#' + that.idSvg + '_id_yellow_color)')
              .text(function(d: any) {
                  return that.getGraphicElement(d.idOfData, 'link').name;
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
                  that.dragended(d);
                }));

    this.trustBoundary.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLink(d);
      } else {
        that.onContextMenu(d3.event, {name: that.getGraphicElement(d.idOfData, 'boundary').name,
                                      type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.trustBoundary.on('click', function(d, i) {
      that.clickOnElement(d);

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
                { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2},
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                endPoint
                /*[endPoint[0], endPoint[1] - 10],
                endPoint,
                [endPoint[0], endPoint[1] + 10]*/
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

    /*// Update and restart the this.simulation.
    this.simulation.nodes(this.diagram.graph.nodes);
    const forceLink: any = this.simulation.force('link');
    forceLink.links(this.diagram.graph.links);
    // this.simulation.alpha(1).restart();
    this.simulation.restart();*/
  }

  rightClickOnLink(linkOrBoundary: any) {
    if (d3.event.defaultPrevented) {
      return;
    }

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
                      that.dragendedForCircleOnLinkOrBoundary(d);
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
    const type = this.getStencil(d.stencilId).type;

    if (type === 'data-flow' || type === 'trust-boundary') {
      d.source = null;
      d.target = null;
      const eventX = d3.event.x / this.diagram.graph.scale - this.diagram.graph.translateX;
      const eventY = d3.event.y / this.diagram.graph.scale - this.diagram.graph.translateY;
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
      // d.position.x = d3.event.x;
      // d.position.y = d3.event.y;
      // oduzimamo pluprecnik da bismo dobili koordinatu gornjeg levog coska
      const newX = (d3.event.x - this.SHAPE_SIZE / 2 - this.diagram.graph.translateX) / this.diagram.graph.scale;
      const dx = newX - d.position.x;
      d.position.x = newX;
      // oduzimamo pluprecnik da bismo dobili koordinatu gornjeg levog coska
      const newY = (d3.event.y - this.SHAPE_SIZE / 2 - this.diagram.graph.translateY) / this.diagram.graph.scale;
      const dy = newY - d.position.y;
      d.position.y = newY;
      const that = this;
      this.link.each(function (l: any) {
            if (l.source && l.source === d.id) {
                /*const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(l.source.x + that.SHAPE_SIZE / 2,
                                                                  l.source.y + that.SHAPE_SIZE / 2,
                                                                  l.target.x + that.SHAPE_SIZE / 2,
                                                                  l.target.y + that.SHAPE_SIZE / 2,
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


                /*const source = that.getNode(l.source);
                const point = that.getNearestPointOnCircle(source.position.x + that.SHAPE_SIZE / 2,
                                                                    source.position.y + that.SHAPE_SIZE / 2,
                                                                    l.points[0].x,
                                                                    l.points[0].y,
                                                                    that.SHAPE_SIZE / 2);
                */

                // menjamo prvu i srednju tacku
                l.points[0].x = l.points[0].x + dx; // d.position.x;
                l.points[0].y = l.points[0].y + dy; // d.position.y;
                l.points[1].x = d3.mean([l.points[0].x, l.points[l.points.length - 1].x]);
                l.points[1].y = d3.mean([l.points[0].y, l.points[l.points.length - 1].y]);
                /*l.points = [
                    point,
                    [point.x, point.y - 10],
                    point,
                    [point.x, point.y + 10],
                    point
                ].concat(l.points.slice(6));

                l.points.splice(5, 0, [
                    d3.mean([l.points[0][0], l.points[l.points.length - 1][0]]),
                    d3.mean([l.points[0][0], l.points[l.points.length - 1][1]])
                  ]
                );*/
              }

              if (l.target && l.target === d.id) {
                /*const target = that.getNode(l.target);
                const point = that.getNearestPointOnCircle(target.position.x + that.SHAPE_SIZE / 2,
                                                          target.position.y + that.SHAPE_SIZE / 2,
                                                          l.points[l.points.length - 1].x,
                                                          l.points[l.points.length - 1].y,
                                                          that.SHAPE_SIZE / 2);
                */

                // menjamo poslednju i srednju tacku
                l.points[l.points.length - 1].x = l.points[l.points.length - 1].x + dx; // point.x;
                l.points[l.points.length - 1].y = l.points[l.points.length - 1].y + dy; // point.y;
                l.points[l.points.length - 2].x = d3.mean([l.points[0].x, l.points[l.points.length - 1].x]);
                l.points[l.points.length - 2].y = d3.mean([l.points[0].y, l.points[l.points.length - 1].y]);
                /*l.points = l.points.slice(0, 5).concat(
                  [
                    point,
                    [point.x, point.y - 10],
                    point,
                    [point.x, point.y + 10],
                    point
                  ]
                );
                l.points.splice(5, 0, [
                    d3.mean([l.points[0][0], l.points[l.points.length - 1][0]]),
                    d3.mean([l.points[0][0], l.points[l.points.length - 1][1]])
                  ]
                );*/
              }
            });
    }

    this.ticked(i);
  }

  dragended(d) {
      const that = this;
      // d.fixed = true;
      // d.fx = null;
      // d.fy = null;

      if (this.getStencil(d.stencilId).tag === 'path') {
          const circles = this.node.data()
                              .map(el => {
                                return { x: el.position.x + this.SHAPE_SIZE / 2, y: el.position.y + this.SHAPE_SIZE / 2 };
                              });

          const nearestPointToLinkStart = this.getNearestPointOnCircles(circles, d.points[0].x, d.points[0].y, this.SHAPE_SIZE / 2);
          console.log('(nearestPointToLinkStart) Distance : ' + nearestPointToLinkStart.distance);
          if (nearestPointToLinkStart.distance <= 25 ) {
              d.points[0].x = nearestPointToLinkStart.x;
              d.points[0].y = nearestPointToLinkStart.y;
              d.source = that.node.data()[nearestPointToLinkStart.index].id;
          }

          const indexOfLastPoint = d.points.length - 1;
          const nearestPointToLinkEnd = this.getNearestPointOnCircles(circles,
                 d.points[indexOfLastPoint].x, d.points[indexOfLastPoint].y, this.SHAPE_SIZE / 2);
          console.log('(nearestPointToLinkEnd) Distance : ' + nearestPointToLinkEnd.distance);
          if (nearestPointToLinkEnd.distance <= 25 ) {
              d.points[indexOfLastPoint].x = nearestPointToLinkEnd.x;
              d.points[indexOfLastPoint].y = nearestPointToLinkEnd.y;
              d.target = that.node.data()[nearestPointToLinkEnd.index].id;
          }
          console.log(this.link.data());
          that.ticked(-1);
      }

      // this.simulation.alpha(0);
      // d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
      // this.ticked();
      // this.simulation.restart();
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

  draggedForCircleOnLinkOrBoundary(d) {
      d.x = d3.event.x;
      d.y = d3.event.y;

      this.ticked(-1);
  }

  dragendedForCircleOnLinkOrBoundary(d) {
    const that = this;
    // d.fixed = true;
    // d.fx = null;
    // d.fy = null;

    const circles = this.node.data()
                          .map(el => {
                            return { x: el.position.x + this.SHAPE_SIZE / 2, y: el.position.y + this.SHAPE_SIZE / 2 };
                          });
    const nearestPoint = this.getNearestPointOnCircles(circles, d3.event.x, d3.event.y, this.SHAPE_SIZE / 2);
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
            return;
          }
      });
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
                    that.dragended(d);
                }));

    this.link.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLink(d);
      } else {
        that.onContextMenu(d3.event, {name: that.getGraphicElement(d.idOfData, 'link').name,
                                      type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.link.on('click', function(d, i) {
        that.clickOnElement(d);

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
                { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2 },
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                // endPoint,
                // [endPoint[0], endPoint[1] - 10],
                // endPoint,
                // [endPoint[0], endPoint[1] + 10],
                endPoint
             ];
            }*/

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
        that.dragended(d);
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
            .attr('height', that.SHAPE_SIZE * 3 / 4);
        stencil.properties.forEach(prop => {
          nodeElement.attr(prop.name, prop.value);
        });
        shape = 'square';
      }

      self.append('text')
          // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
          // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
          // .attr('text-anchor', 'middle')
          // .attr('font-size', that.TEXT_SIZE)
          .attr('font-family', 'sans-serif')
          .attr('fill', 'white')
          .attr('id', that.idSvg + '_id_text' + i)
          // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')
          .text(that.getGraphicElement(d.idOfData, 'node').name)
          .classed('wrap', true)
          .classed('node-text', true)
          .classed('zoom-element', true);

      d3plus.textwrap()
          .config(that.nodeTextConfig)
          .container('#' + that.idSvg + '_id_text' + i)
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
      that.onContextMenu(d3.event, {name: that.getGraphicElement(d.idOfData, 'node').name,
                                    type: that.getStencil(d.stencilId).type, id: d.id});

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.node.on('click', function(d, i) {
      that.clickOnElement(d);

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
                let a;
                let point;

                if (d.target) {
                  const target = that.getNode(d.target);
                  point = { x: target.position.x + that.SHAPE_SIZE / 2, y: target.position.y + that.SHAPE_SIZE / 2 };
                } else {
                    point = d.points[0];
                }

                if (point.x >= endPoint.x) {
                    a = 10;
                } else {
                    a = -10;
                }

                const points = [ // formiramo trougao
                  [endPoint.x, endPoint.y + 10],
                  [endPoint.x + a, endPoint.y],
                  [endPoint.x, endPoint.y - 10],
                  [endPoint.x, endPoint.y + 10]
                ];

                const pathData = that.lineGenerator(points);
                self.attr('d', pathData);

                if (d.target) {
                  const angle = that.getAngleForRotating(point, endPoint);
                  console.log('angle: ' + angle);
                  const firstThreePoints = points.slice(0, points.length - 1);
                  const xMean = d3.mean(firstThreePoints.map(p => p[0]));
                  const yMean = d3.mean(firstThreePoints.map(p => p[1]));
                  // xMean i yMean predstavljaju koordinate tacke (teziste) oko koje cemo rotirati strelice (trouglove)
                  self.attr('transform', `rotate(${angle + ' ' + xMean + ' ' + yMean})`);
                  // self.attr('transform-origin', xMean + ' ' + yMean);
                }
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
              .attr('font-size', that.TEXT_SIZE * 3 / 2)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'white')
              .attr('filter', 'url(#' + that.idSvg + '_id_yellow_color)')
              .text(function(d: any) {
                  return that.getGraphicElement(d.idOfData, 'link').name;
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
                    that.dragended(d);
                }));

    this.trustBoundary.on('contextmenu', function(d, i) {
      if (d3.event.ctrlKey) {
        that.rightClickOnLink(d);
      } else {
        that.onContextMenu(d3.event, {name: that.getGraphicElement(d.idOfData, 'boundary').name,
                                      type: that.getStencil(d.stencilId).type, id: d.id});
      }

      // ovo ce prekinuti obradu ovog eventa
      // i nece se prikazati browser-ov context menu
      d3.event.preventDefault();
      d3.event.stopPropagation();
    });

    this.trustBoundary.on('click', function(d, i) {
        that.clickOnElement(d);

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

  getAngleForRotating(centerOrStartPoint: Point, pointOnCircle: Point) {
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
    return coef * this.radiansToDegrees(angle);
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
                    const self = d3.select(this);
                    self.select('text').remove();
                    self.append('text')
                        // .attr('x', d.position.x + that.SHAPE_SIZE / 20)
                        // .attr('y', d.position.y + that.SHAPE_SIZE / 2)
                        // .attr('text-anchor', 'middle')
                        // .attr('font-size', that.TEXT_SIZE)
                        .attr('font-family', 'sans-serif')
                        .attr('fill', 'white')
                        .attr('id', that.idSvg + '_id_text' + i)
                        // .attr('filter', 'url(#' + that.idSvg + '_id_orange_color)')
                        .text(that.getGraphicElement(d.idOfData, 'node').name)
                        .classed('wrap', true)
                        .classed('node-text', true)
                        .classed('zoom-element', true);

                    that.nodeTextConfig = false;

                    d3plus.textwrap()
                        .config(that.nodeTextConfig)
                        .container('#' + that.idSvg + '_id_text' + i)
                        .shape('circle')
                        .padding(10)
                        // .align('middle')
                        .valign('middle')
                        .draw();

                    that.nodeTextConfig = true;
                  }
                });
      this.nodeText = svgCanvas.selectAll(this.selectSvg + ' .node-text');
    }

    this.linkArrow.each(function(d: any, i) {
      const self = d3.select(this);
      const endPoint = d.points[d.points.length - 1];
      let a;
      let point;

      if (d.target) {
        const target = that.getNode(d.target);
        point = { x: target.position.x + that.SHAPE_SIZE / 2, y: target.position.y + that.SHAPE_SIZE / 2 };
      } else {
          point = d.points[0];
      }

      if (!self.attr('transform')) {
          a = 10;
      } else {
        if (point.x >= endPoint.x) {
            a = 10;
        } else {
            a = -10;
        }
      }

      const points = [ // formiramo trougao
        [endPoint.x, endPoint.y + 10],
        [endPoint.x + a, endPoint.y],
        [endPoint.x, endPoint.y - 10],
        [endPoint.x, endPoint.y + 10]
      ];

      const pathData = that.lineGenerator(points);
      self.attr('d', pathData);

      if (d.target) {
        const angle = that.getAngleForRotating(point, endPoint);
        console.log('angle: ' + angle);
        const firstThreePoints = points.slice(0, points.length - 1);
        const xMean = d3.mean(firstThreePoints.map(p => p[0]));
        const yMean = d3.mean(firstThreePoints.map(p => p[1]));
        // xMean i yMean predstavljaju koordinate tacke (teziste) oko koje cemo rotirati strelice (trouglove)
        self.attr('transform', `rotate(${angle + ' ' + xMean + ' ' + yMean})`);
        // self.attr('transform-origin', xMean + ' ' + yMean);
      }
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

  groupBy(list) {
    const map = new Map();
    list.forEach((item) => {
         let key;
         const stencil: Stencil = this.getStencil(item.stencilId);
         if (stencil.tag === 'image') {
           key = 'circle';
         } else {
           key = stencil.tag;
         }
         const collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
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

  getNearestPointOnCircle(x1: number, y1: number, x2: number, y2: number, r: number) {
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

  getNearestPointOnCircles(circles: any[], x2: number, y2: number, r: number) {
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
    let minDistance: number = this.getDistance({ x: points[0].x + this.diagram.graph.translateX,
                                                y: points[0].y + this.diagram.graph.translateY }, point);

    points = points.slice(1);
    points.forEach(p => {
        const distance: number = this.getDistance({ x: p.x + this.diagram.graph.translateX,
                                                    y: p.y + this.diagram.graph.translateY }, point);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = p;
        }
    });

    return { x: nearestPoint.x + this.diagram.graph.translateX, y: nearestPoint.y + this.diagram.graph.translateY };
  }

  getDistance(p1: Point, p2: Point) {
    return Math.sqrt( Math.pow(p1.x - p2.x, 2)
                    + Math.pow(p1.y - p2.y, 2));
  }

  getGraphicElement(idOfData: string, type: string) {
    if (type === 'node') {
      return this.diagram.elements.filter(e => e.id === idOfData)[0];
    } else if (type === 'link') {
      return this.diagram.flows.filter(f => f.id === idOfData)[0];
    } else if (type === 'boundary') {
      return this.diagram.boundaries.filter(f => f.id === idOfData)[0];
    } else {
      alert('Not implemented for type: ' + type + '(getGraphicElementName method)');
      return null;
    }
  }

  getStencil(id: string) {
      return this.stencils.filter(s => s.id === id)[0];
  }

  clickOnElement(d: any) {
    let obj = null;
    const stencil: Stencil = this.getStencil(d.stencilId);
    if (stencil.type === 'process' || stencil.type === 'complex-process') {
        obj = this.diagram.elements.filter(e => e.id === d.idOfData)[0];
    } else if (stencil.type === 'data-flow') {
      obj = this.diagram.flows.filter(f => f.id === d.idOfData)[0];
    } else {
      alert('Not implented for type: ' + stencil.type + ' (this.link.onClick method)');
    }

    this.propertiesService.setSelectedElement(obj);
  }

}
