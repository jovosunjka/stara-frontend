import { Component, OnInit, AfterContentInit, Input } from '@angular/core';
import * as d3 from 'd3';
import { CanvasService } from './service/canvas.service';
import { NewGraphicElement } from 'src/app/shared/model/new-graphic-element';
import { mean } from 'd3';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, AfterContentInit {
  static svgIdIndexGenerator = 0;
  selectSvg: string;

  @Input()
  eventEmitterName: string;

  elements: any[];

  dragHandler: any;

  // private IMAGE_SIZE = 42;

  // private simulation: any;
  private node: any;
  private link: any;
  private nodeText: any;
  private linkText: any;

  private idNodeGenerator = 0;
  private idLinkGenerator = 0;

  private SHAPE_SIZE = 50;
  private TEXT_SIZE = 10;


  private MAX_ZOOM_OUT = 0.2;
  private MAX_ZOOM_IN = 100;
  private scale = 1;
  private translateX = 0;
  private translateY = 0;

  private zoom: any;

  nodeData: any[] = [
    {
      element: {
                name: 'Process 0',
                type: 'process',
                tag: 'circle',
                properties: [{name: 'fill', value: 'blue'}]
              },
      x: 20,
      y: 20,
      id: this.idNodeGenerator++
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
  ];

  nodeLinks: any[] = [
    {
      element: {
        name: 'Data Flow 0',
        type: 'data-flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 10
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      enabledCirclesOnLink: false,
      points: null,
      source: 0,
      target: 1,
      distance: 10,
      id: this.idLinkGenerator++
    },
    {
      element: {
        name: 'Data Flow 1',
        type: 'data-flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 10
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      enabledCirclesOnLink: false,
      points: null,
      source: 1,
      target: 2,
      distance: 20,
      id: this.idLinkGenerator++
    },
    {
      element: {
        name: 'Data Flow 2',
        type: 'data-flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 10
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      enabledCirclesOnLink: false,
      points: null,
      source: 2,
      target: 3,
      distance: 30,
      id: this.idLinkGenerator++
    },
    {
      element: {
        name: 'Data Flow 3',
        type: 'data-flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 10
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      enabledCirclesOnLink: false,
      points: null,
      source: 3,
      target: 4,
      distance: 40,
      id: this.idLinkGenerator++
    },
    {
      element: {
        name: 'Data Flow 4',
        type: 'data-flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 10
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      enabledCirclesOnLink: false,
      points: null,
      source: 4,
      target: 5,
      distance: 50,
      id: this.idLinkGenerator++
    },
    {
      element: {
        name: 'Data Flow 5',
        type: 'data-flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 10
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      enabledCirclesOnLink: false,
      points: null,
      source: 5,
      target: 6,
      distance: 60,
      id: this.idLinkGenerator++
    },
    {
      element: {
        name: 'Data Flow 6',
        type: 'data-flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 10
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      enabledCirclesOnLink: false,
      points: null,
      source: 6,
      target: 0,
      distance: 70,
      id: this.idLinkGenerator++
    }
  ];

  lineGenerator: any;

  private patternImageGenerator = 0;
  private imagesMap: Map<string, string>;

  constructor(private canvasService: CanvasService) {
    this.selectSvg = 'svg#id_canvas_' + CanvasComponent.svgIdIndexGenerator++;
    console.log(this.selectSvg);

    this.imagesMap = new Map();
  }

  ngOnInit() {
  }

  ngAfterContentInit() {
    if (CanvasComponent.svgIdIndexGenerator === 3) {
      CanvasComponent.svgIdIndexGenerator++; // ovo stavljamo da u sledecoj komponenti ne bi usli u ovaj if
      let index = 0;
      d3.selectAll('app-canvas svg').attr('id', function() {
        return 'id_canvas_' + index++;
      });
    }
    /*this.dragHandler = d3.drag()
        .on('drag', function (d: any) {
            d3.select(this)
                .attr('x', d3.event.x)
                .attr('y', d3.event.y);
        });

    this.dragHandler(d3.selectAll('image'));
    */

   this.lineGenerator = d3.line().curve(d3.curveCardinal);

    this.makeGraph();

    this.doZoom(d3.select(this.selectSvg));

    // dodajemo svoj eventEmitterName u mapu svih eventEmitter-a
    this.canvasService.addEventEmitterName(this.eventEmitterName);

    this.canvasService.getEventEmitter(this.eventEmitterName).subscribe(
      (newGraphicElement: NewGraphicElement) => {
        this.addGraphicElement(newGraphicElement);
      }
    );


    // dodajemo svoj eventEmitterName za zoomOut u mapu svih eventEmitter-a
    this.canvasService.addEventEmitterName(this.eventEmitterName + 'zoom_out');

    this.canvasService.getEventEmitter(this.eventEmitterName + 'zoom_out').subscribe(
      () => this.zoomOut()
    );

    const that = this;
    d3.select(this.selectSvg).on('click', function () {
      that.clickOnSvg();
    });
  }

  addGraphicElement(newGraphicElement: NewGraphicElement) {
    if (newGraphicElement.tag === 'path') {
      const newId = this.idLinkGenerator++;
      newGraphicElement.name += ' ' + newId;
      this.nodeLinks.push(
          {element: newGraphicElement,
            points: [
              [newGraphicElement.x, newGraphicElement.y],
              /*[(newGraphicElement.x
                + (newGraphicElement.x + newGraphicElement.x + 2 * this.SHAPE_SIZE) / 2) / 2,
                  newGraphicElement.y],*/
              [(newGraphicElement.x + newGraphicElement.x + this.SHAPE_SIZE) / 2,
                newGraphicElement.y],
              /*[((newGraphicElement.x + newGraphicElement.x + 2 * this.SHAPE_SIZE) / 2
                 + newGraphicElement.x + 2 * this.SHAPE_SIZE) / 2, newGraphicElement.y],*/
              [newGraphicElement.x + this.SHAPE_SIZE, newGraphicElement.y],
            ],
            source: null,
            target: null,
            distance: 2 * this.SHAPE_SIZE,
            id: newId
          }
      );
    } else {
      const newId = this.idNodeGenerator++;
      newGraphicElement.name += ' ' + newId;
      this.nodeData.push({element: newGraphicElement, x: newGraphicElement.x, y: newGraphicElement.y, id: newId});
    }

    this.restart();
  }

  zoomOut() {
    this.translateX = 0;
    this.translateY = 0;
    this.scale = 1;

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
    this.link = this.link.data(this.nodeLinks);
    this.link.exit().remove();
    this.link = this.link.enter()
              .append('path')
              .classed('zoom-element', true)
              .classed('link', true)
              .style('cursor', 'move')
              .call(d3.drag()
                .on('start', function(d) {
                  that.dragstarted(d);
                })
                .on('drag', function(d) {
                  that.dragged(d);
                })
                .on('end', function(d) {
                  that.dragended(d);
                }));

    this.link.on('contextmenu', function(d) {
        that.clickOnLink(d);
        d3.event.preventDefault(); // ovo ce prekinuti obradu ovog eventa
        // i nece se prikazati browser-ov context menu
    });

    this.link.each(function(d: any, i) {
      const self = d3.select(this);

      d.element.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (d.element.tag === 'path') {
            if (d.source && d.target) {
              const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(d.source.x + that.SHAPE_SIZE / 2,
                                                                d.source.y + that.SHAPE_SIZE / 2,
                                                                d.target.x + that.SHAPE_SIZE / 2,
                                                                d.target.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              d.points = [
                startPoint,
                // [startPoint[0], startPoint[1] - 10],
                // startPoint,
                // [startPoint[0], startPoint[1] + 10],
                // startPoint,
                [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2],
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                endPoint,
                [endPoint[0], endPoint[1] - 10],
                endPoint,
                [endPoint[0], endPoint[1] + 10]
             ];
            }

            const pathData = that.lineGenerator(d.points);
            self.attr('d', pathData);
      }

    });
    this.link = svgCanvas.selectAll(this.selectSvg + ' .link');

    this.linkText = this.linkText.data(this.nodeLinks);
    this.linkText.exit().remove();
    this.linkText = this.linkText.enter()
              .append('text')
              .attr('x', function(d: any) {
                  return mean(d.points.map(point => point[0]));
              })
              .attr('y', function(d: any) {
                  return mean(d.points.map(point => point[1]));
              })
              // .attr('text-anchor', 'middle')
              .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'green')
              .text(function(d: any) {
                  return d.element.name;
              })
              .classed('link-text', true)
              .classed('zoom-element', true);
    this.linkText = svgCanvas.selectAll(this.selectSvg + ' text.link-text');

    // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
    this.nodeData
      .filter(n => n.element.tag === 'image')
      .forEach(n => {
        const imagePath = n.element.properties.filter(prop => prop.name === 'xlink:href')[0].value;
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

    const nodeMap = this.groupBy(this.nodeData);
    nodeMap.forEach((value, key) => {
        let node = svgCanvas.selectAll(this.selectSvg + ' ' + key + '.node').data(value); // value je podniz od this.nodeData
        node.exit().remove();
        node = node.enter()
              .append(key)
                .classed('zoom-element', true)
                .classed('node', true)
                .style('cursor', 'move')
                .call(d3.drag()
                .on('start', function(d) {
                  that.dragstarted(d);
                })
                .on('drag', function(d) {
                  that.dragged(d);
                })
                .on('end', function(d) {
                  that.dragended(d);
                }));

        node.each(function(d: any, i ) {
            const self = d3.select(this);

            /*d.element.properties.forEach(prop => {
            self.attr(prop.name, prop.value);
            });*/

            /*if (d.element.tag === 'image') {
            self.attr('x', d.x)
                .attr('y', d.y)
                .attr('width', that.SHAPE_SIZE)
                .attr('height', that.SHAPE_SIZE);
            } */
            if (d.element.tag === 'circle' || d.element.tag === 'image') {
              self.attr('r', that.SHAPE_SIZE / 2)
                  .attr('cx', d.x + that.SHAPE_SIZE / 2)
                  .attr('cy', d.y + that.SHAPE_SIZE / 2);

              if (d.element.tag === 'circle') {
                d.element.properties.forEach(prop => {
                  self.attr(prop.name, prop.value);
                  });
              } else if (d.element.tag === 'image') {
                const imagePath = d.element.properties.filter(prop => prop.name === 'xlink:href')[0].value;
                self.attr('fill', 'url(#' + that.imagesMap.get(imagePath) + ')');
              }
            }
        });
    });
    this.node = svgCanvas.selectAll(this.selectSvg + ' .node');
    console.log(this.node.data());

    this.nodeText = this.nodeText.data(this.nodeData);
    this.nodeText.exit().remove();
    this.nodeText = this.nodeText.enter()
        .append('text')
        .attr('x', function(d: any) { return d.x; })
        .attr('y', function(d: any) { return d.y; })
        // .attr('text-anchor', 'middle')
        .attr('font-size', that.TEXT_SIZE)
        .attr('font-family', 'sans-serif')
        .attr('fill', 'green')
        .text(function(d: any) { return d.element.name; })
        .classed('node-text', true)
        .classed('zoom-element', true);
    this.nodeText = svgCanvas.selectAll(this.selectSvg + ' text.node-text');

    /*d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
        return 'translate(' + that.translateX + ','
          + that.translateY + ') scale(' + that.scale + ')';
    });*/

    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
        const self = d3.select(this);
        let x = that.translateX;
        let y = that.translateY;

        if (self.classed('link-arrows')) {
          const data: any = self.data()[0];
          const point = data.points[data.points.length - 1];
          x += point[0];
          y += point[1];
        }
        return 'translate(' + x + ','
          + y + ') scale(' + that.scale + ')';
    });

    /*// Update and restart the this.simulation.
    this.simulation.nodes(this.nodeData);
    const forceLink: any = this.simulation.force('link');
    forceLink.links(this.nodeLinks);
    // this.simulation.alpha(1).restart();
    this.simulation.restart();*/
  }

  clickOnLink(link: any) {
    if (d3.event.defaultPrevented) {
      return;
    }

    const that = this;
    const circlesOnLink = d3.select(this.selectSvg).selectAll(' circle.circle-on-link-' + link.id);

    link.enabledCirclesOnLink = !link.enabledCirclesOnLink;

    if (link.enabledCirclesOnLink) {
      circlesOnLink.data(link.points).enter()
          .append('circle')
            .attr('cx', function(d: any) {
              return d[0];
            })
            .attr('cy', function(d: any) {
              return d[1];
            })
            .attr('r', 10)
            .attr('fill', 'red')
            .classed('circle-on-link', true)
            .classed('circle-on-link-' + link.id, true)
            .classed('zoom-element', true)
            .call(d3.drag()
                    .on('start', function(d) {
                      that.dragstartedForCircleOnLink(d, link);
                    })
                    .on('drag', function(d) {
                      that.draggedForCircleOnLink(d);
                    })
                    .on('end', function(d) {
                      that.dragendedForCircleOnLink(d);
                    }));
    } else {
        circlesOnLink.remove();
    }
  }

  clickOnSvg() {
      d3.selectAll(this.selectSvg + ' circle.circle-on-link').remove();
      this.ticked();
  }

  doZoom(areaForZoom) {
    const that = this;

    this.zoom = d3.zoom()
    .scaleExtent([that.MAX_ZOOM_OUT, that.MAX_ZOOM_IN])
    .on('zoom', function () {
        // console.log(d3.event);
        // simp.attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
        d3.selectAll(that.selectSvg + ' .zoom-element')
            .each(function(d: any, i) {
                that.translateX = d3.event.transform.x;
                that.translateY = d3.event.transform.y;
                that.scale = d3.event.transform.k;
            });
        that.ticked();
            /*
            .attr('transform', function(d: any) {
                // d.x = d3.event.transform.x;
                // d.y = d3.event.transform.y;
                that.scale = d3.event.transform.k;
                return 'translate(' + d3.event.transform.x + ','
                  + d3.event.transform.y + ') scale(' + that.scale + ')';
            });*/
            /*.attr('id', function(d: any) {
                d.x = d3.event.transform.x;
                d.y = d3.event.transform.y;
                that.scale = d3.event.transform.k;
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
    d.fx = d.x;
    d.fy = d.y;


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

  dragged(d) {
    if (d.element.tag === 'path') {
      d.source = null;
      d.target = null;
      const nearestPoint = this.getNearestPoint(d.points, [d3.event.x, d3.event.y]);
      const dx = d3.event.x - nearestPoint[0];
      const dy = d3.event.y - nearestPoint[1];
      d.points.forEach(point => {
        point[0] = point[0] + dx;
        point[1] = point[1] + dy;
      });
    } else {
      d.x = d3.event.x;
      d.y = d3.event.y;
      const that = this;
      this.link.each(function (l: any) {
            if (l.source && l.source.id === d.id) {
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


                // TODO ovde nesto ne valja, pokreni program pa ces videiti, baca undefined
                const point = that.getNearestPointOnCircle(l.source.x + that.SHAPE_SIZE / 2,
                                                                    l.source.y + that.SHAPE_SIZE / 2,
                                                                    l.points[0][0],
                                                                    l.points[0][1],
                                                                    that.SHAPE_SIZE / 2);

                // menjamo prvu i srednju tacku
                l.points[0][0] = point.x;
                l.points[0][1] = point.y;
                l.points[1][0] = mean([l.points[0][0], l.points[l.points.length - 1][0]]);
                l.points[1][1] = mean([l.points[0][1], l.points[l.points.length - 1][1]]);
                /*l.points = [
                    point,
                    [point.x, point.y - 10],
                    point,
                    [point.x, point.y + 10],
                    point
                ].concat(l.points.slice(6));

                l.points.splice(5, 0, [
                    mean([l.points[0][0], l.points[l.points.length - 1][0]]),
                    mean([l.points[0][0], l.points[l.points.length - 1][1]])
                  ]
                );*/
              }

              if (l.target && l.target.id === d.id) {
                const point = that.getNearestPointOnCircle(l.target.x + that.SHAPE_SIZE / 2,
                                                          l.target.y + that.SHAPE_SIZE / 2,
                                                          l.points[l.points.length - 1][0],
                                                          l.points[l.points.length - 1][1],
                                                          that.SHAPE_SIZE / 2);

                // menjamo poslednju i srednju tacku
                l.points[l.points.length - 1][0] = point.x;
                l.points[l.points.length - 1][1] = point.y;
                l.points[l.points.length - 2][0] = mean([l.points[0][0], l.points[l.points.length - 1][0]]);
                l.points[l.points.length - 2][1] = mean([l.points[0][1], l.points[l.points.length - 1][1]]);
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
                    mean([l.points[0][0], l.points[l.points.length - 1][0]]),
                    mean([l.points[0][0], l.points[l.points.length - 1][1]])
                  ]
                );*/
              }
            });
    }

    this.ticked();
  }

  dragended(d) {
      const that = this;
      // d.fixed = true;
      d.fx = null;
      d.fy = null;

      if (d.element.tag === 'path') {
          const circles = this.node.data().map(el => [el.x + this.SHAPE_SIZE / 2, el.y + this.SHAPE_SIZE / 2]);

          const nearestPointToLinkStart = this.getNearestPointOnCircles(circles, d.points[0][0], d.points[0][1], this.SHAPE_SIZE / 2);
          console.log('(nearestPointToLinkStart) Distance : ' + nearestPointToLinkStart.distance);
          if (nearestPointToLinkStart.distance <= 25 ) {
              d.points[0][0] = nearestPointToLinkStart.x;
              d.points[0][1] = nearestPointToLinkStart.y;
              d.source = that.node.data()[nearestPointToLinkStart.index];
          }

          const indexOfLastPoint = d.points.length - 1;
          const nearestPointToLinkEnd = this.getNearestPointOnCircles(circles,
                 d.points[indexOfLastPoint][0], d.points[indexOfLastPoint][1], this.SHAPE_SIZE / 2);
          console.log('(nearestPointToLinkEnd) Distance : ' + nearestPointToLinkEnd.distance);
          if (nearestPointToLinkEnd.distance <= 25 ) {
              d.points[indexOfLastPoint][0] = nearestPointToLinkEnd.x;
              d.points[indexOfLastPoint][1] = nearestPointToLinkEnd.y;
              d.target = that.node.data()[nearestPointToLinkEnd.index];
          }
          console.log(this.link.data());
          that.ticked();
      }

      // this.simulation.alpha(0);
      // d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
      // this.ticked();
      // this.simulation.restart();
  }

  dragstartedForCircleOnLink(d, link) {
    // Called when drag event starts. It stop the propagation of the click event
    d3.event.sourceEvent.stopPropagation();
    // d.fixed = false;
    // this.simulation.stop(); // stops the force auto positioning before you start dragging
    // this.simulation.restart();
    // this.simulation.alpha(0.7);
    // this.simulation.alpha(0.7);
    const indexOfPoint = link.points.indexOf(d);
    if (indexOfPoint === 0) {
      link.source = null;
    } else if ( indexOfPoint === link.points.length - 1) {
      link.target = null;
    }

    d.fx = d[0];
    d.fy = d[1];
  }

  draggedForCircleOnLink(d) {
      d[0] = d3.event.x;
      d[1] = d3.event.y;

      this.ticked();
  }

  dragendedForCircleOnLink(d) {
    const that = this;
    // d.fixed = true;
    d.fx = null;
    d.fy = null;

    const circles = this.node.data().map(el => [el.x + this.SHAPE_SIZE / 2, el.y + this.SHAPE_SIZE / 2]);
    const nearestPoint = this.getNearestPointOnCircles(circles, d3.event.x, d3.event.y, this.SHAPE_SIZE / 2);
    console.log('Distance: ' + nearestPoint.distance);
    if (nearestPoint.distance <= 25 ) {
      this.link.each(function (el: any) {
          if (el.points[0] === d || el.points[el.points.length - 1] === d) {
            d[0] = nearestPoint.x;
            d[1] = nearestPoint.y;
            if (el.points[0] === d) {
              el.source = that.node.data()[nearestPoint.index];
            } else if (el.points[el.points.length - 1] === d) {
              el.target = that.node.data()[nearestPoint.index];
            }
            that.ticked();
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

    this.nodeLinks.forEach((l: any) => {
      l.source = this.getNode(l.source);
      l.target = this.getNode(l.target);
    });

    /*const linkForce  = d3.forceLink(this.nodeLinks)
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
              .data(this.nodeLinks)
              .enter()
              .append('path')
              .classed('link', true)
              .classed('zoom-element', true)
              .style('cursor', 'move')
              .call(d3.drag()
                .on('start', function(d) {
                  if (!d3.event.ctrlKey) {
                    that.dragstarted(d);
                  }
                })
                .on('drag', function(d) {
                  if (!d3.event.ctrlKey) {
                    that.dragged(d);
                  }
                })
                .on('end', function(d) {
                  if (!d3.event.ctrlKey) {
                    that.dragended(d);
                  }
                }));

    this.link.on('contextmenu', function(d) {
        that.clickOnLink(d);
        d3.event.preventDefault(); // ovo ce prekinuti obradu ovog eventa
        // i nece se prikazati browser-ov context menu
    });

    this.link.each(function(d: any, i) {
      const self = d3.select(this);

      d.element.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (d.element.tag === 'path') {
            if (d.source && d.target) {
              const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(d.source.x + that.SHAPE_SIZE / 2,
                                                                d.source.y + that.SHAPE_SIZE / 2,
                                                                d.target.x + that.SHAPE_SIZE / 2,
                                                                d.target.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              d.points = [
                startPoint,
                // [startPoint[0], startPoint[1] - 10],
                // startPoint,
                // [startPoint[0], startPoint[1] + 10],
                // startPoint,
                [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2],
                // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                // endPoint,
                // [endPoint[0], endPoint[1] - 10],
                // endPoint,
                // [endPoint[0], endPoint[1] + 10],
                endPoint
             ];
            }

            const pathData = that.lineGenerator(d.points);
            self.attr('d', pathData);
      }

    });
    this.link = svgCanvas.selectAll(this.selectSvg + ' .link');

    const triangle = d3.symbol()
            .type(d3.symbolTriangle)
            .size(150);

    svgCanvas.selectAll(this.selectSvg + ' path.link-arrows')
              .data(this.nodeLinks.filter(l => l.target)) // ostaju samo oni koji imaju definisan target
              .enter()
              .append('path')
              .attr('d', triangle)
              .attr('transform', function(d) {
                const point = d.points[d.points.length - 1];
                return 'translate(' + point[0] + ',' + point[1] + ')'; })
              .style('fill', '#585858')
              .classed('link-arrows', true)
              .classed('zoom-element', true);

    this.linkText = svgCanvas.selectAll(this.selectSvg + ' text.link-text')
              .data(this.nodeLinks)
              .enter()
              .append('text')
              .attr('x', function(d: any) {
                  return mean(d.points.map(point => point[0]));
              })
              .attr('y', function(d: any) {
                  return mean(d.points.map(point => point[1]));
              })
              // .attr('text-anchor', 'middle')
              .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'green')
              .text(function(d: any) {
                  return d.element.name;
              })
              .classed('link-text', true)
              .classed('zoom-element', true);

    // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
    this.nodeData
      .filter(n => n.element.tag === 'image')
      .forEach(n => {
        const imagePath = n.element.properties.filter(prop => prop.name === 'xlink:href')[0].value;
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

    const nodeMap = this.groupBy(this.nodeData);
    nodeMap.forEach((value, key) => {
        const node = svgCanvas.selectAll(this.selectSvg + ' ' + key + '.node').data(value) // value je podniz od this.nodeData
              .enter()
              .append(key)
                .classed('zoom-element', true)
                .classed('node', true)
                .style('cursor', 'move')
                .call(d3.drag()
                .on('start', function(d) {
                  that.dragstarted(d);
                })
                .on('drag', function(d) {
                  that.dragged(d);
                })
                .on('end', function(d) {
                  that.dragended(d);
                }));

        node.each(function(d: any, i ) {
            const self = d3.select(this);

            /*d.element.properties.forEach(prop => {
            self.attr(prop.name, prop.value);
            });*/

            /*if (d.element.tag === 'image') {
            self.attr('x', d.x)
                .attr('y', d.y)
                .attr('width', that.SHAPE_SIZE)
                .attr('height', that.SHAPE_SIZE);
            } */
            if (d.element.tag === 'circle' || d.element.tag === 'image') {
              self.attr('r', that.SHAPE_SIZE / 2)
                  .attr('cx', d.x + that.SHAPE_SIZE / 2)
                  .attr('cy', d.y + that.SHAPE_SIZE / 2);

              if (d.element.tag === 'circle') {
                d.element.properties.forEach(prop => {
                  self.attr(prop.name, prop.value);
                  });
              } else if (d.element.tag === 'image') {
                const imagePath = d.element.properties.filter(prop => prop.name === 'xlink:href')[0].value;
                self.attr('fill', 'url(#' + that.imagesMap.get(imagePath) + ')');
              }
            }
        });
    });
    this.node = svgCanvas.selectAll(this.selectSvg + ' .node');
    console.log(this.node.data());

    this.nodeText = svgCanvas.selectAll(this.selectSvg + ' text.node-text')
        .data(this.nodeData)
        .enter()
        .append('text')
        .attr('x', function(d: any) { return d.x; })
        .attr('y', function(d: any) { return d.y; })
        // .attr('text-anchor', 'middle')
        .attr('font-size', that.TEXT_SIZE)
        .attr('font-family', 'sans-serif')
        .attr('fill', 'green')
        .text(function(d: any) { return d.element.name; })
        .classed('node-text', true)
        .classed('zoom-element', true);

    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
        const self = d3.select(this);
        let x = that.translateX;
        let y = that.translateY;

        if (self.classed('link-arrows')) {
          const data: any = self.data()[0];
          const point = data.points[data.points.length - 1];
          x += point[0];
          y += point[1];
        }
        return 'translate(' + x + ','
          + y + ') scale(' + that.scale + ')';
    });

    /*this.simulation
      .on('tick', function() {
        that.ticked();
      })
      .on('end', function() {
        that.ticked();
      });*/
  }

  getNode(id: number) {
    const filtered = this.nodeData.filter(n => n.id === id);
    if (filtered.length > 0) {
      return filtered[0];
    } else {
      return null;
    }
  }

  dist(d) {
    return d.distance + 30;
  }

  ticked() {
    const that = this;

    this.link.each(function(d: any, i) {
        /*if (d.source && d.target) {
          const startAndEndPoints = that.getStartAndEndPointsForLinkOnCircle(d.source.x + that.SHAPE_SIZE / 2,
                                                            d.source.y + that.SHAPE_SIZE / 2,
                                                            d.target.x + that.SHAPE_SIZE / 2,
                                                            d.target.y + that.SHAPE_SIZE / 2,
                                                            that.SHAPE_SIZE / 2);
          const startPoint = startAndEndPoints.start;
          const endPoint = startAndEndPoints.end;

          d.points = [
            startPoint,
            // [startPoint[0], startPoint[1] - 10],
            // startPoint,
            // [startPoint[0], startPoint[1] + 10],
            // startPoint,
            [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2],
            // [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
            endPoint,
            [endPoint[0], endPoint[1] - 10],
            endPoint,
            [endPoint[0], endPoint[1] + 10]
          ];
        }*/

        const pathData = that.lineGenerator(d.points);
        const self = d3.select(this);
        self.attr('d', pathData);

        d3.selectAll(that.selectSvg + ' circle.circle-on-link-' + d.id)
              .attr('cx', function(point: any) {
                 return point[0];
              })
              .attr('cy', function(point: any) {
                return point[1];
              });
    });

    this.linkText
        .attr('x', function(d: any) {
            return mean(d.points.map(point => point[0]));
        })
        .attr('y', function(d: any) {
            return mean(d.points.map(point => point[1]));
        });

    this.node.each(function(d: any) {
        const self = d3.select(this);
        /*if (d.element.tag === 'image') {
          self.attr('x', function(el: any) { return el.x; })
              .attr('y', function(el: any) { return el.y; });
        }*/
        if (d.element.tag === 'circle' || d.element.tag === 'image') {
          self.attr('cx', function(el: any) { return el.x + that.SHAPE_SIZE / 2; })
              .attr('cy', function(el: any) { return el.y + that.SHAPE_SIZE / 2; });
        }
    });

    this.nodeText.attr('x', function(d: any) { return d.x; })
              .attr('y', function(d: any) { return d.y; });

    /*d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
        return 'translate(' + that.translateX + ','
          + that.translateY + ') scale(' + that.scale + ')';
    });*/

    d3.selectAll(this.selectSvg + ' .zoom-element').attr('transform', function() {
        const self = d3.select(this);
        let x = that.translateX;
        let y = that.translateY;

        if (self.classed('link-arrows')) {
          const data: any = self.data()[0];
          const point = data.points[data.points.length - 1];
          x += point[0];
          y += point[1];
        }
        return 'translate(' + x + ','
          + y + ') scale(' + that.scale + ')';
    });
  }

  groupBy(list) {
    const map = new Map();
    list.forEach((item) => {
         let key;
         if (item.element.tag === 'image') {
           key = 'circle';
         } else {
           key = item.element.tag;
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

    return {start: [xStart, yStart],  end: [ xEnd, yEnd]};
  }

  getNearestPointOnCircle(x1: number, y1: number, x2: number, y2: number, r: number) {
    // x1 = x1 + this.translateX;
    // y2 = x1 + this.translateY;
    // x2 = x2 + this.translateX;
    // y2 = y2 + this.translateY;

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
    // x2 = x2 + this.translateX;
    // y2 = x2 + this.translateY;

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

    // x1 = circles[0][0] + this.translateX;
    // y1 = circles[0][1] + this.translateY;
    x1 = circles[0][0];
    y1 = circles[0][1];
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

    minDistance = this.getDistance([xNearest, yNearest], [x2, y2]);

    circles = circles.slice(1);
    circles.forEach((c, i) => {
        // x1 = c[0] + this.translateX;
        // y1 = c[1] + this.translateY;
        x1 = c[0];
        y1 = c[1];
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

        distance = this.getDistance([xCurrentNearest, yCurrentNearest], [x2, y2]);
        if (distance < minDistance) {
          minDistance = distance;
          xNearest = xCurrentNearest;
          yNearest = yCurrentNearest;
          index = i + 1; // zato sto smo slice-ovali nulti element, pa iteriramo od prvog
        }
    });

    return {x: xNearest, y: yNearest, distance: minDistance, index: index};
  }

  getNearestPoint(points: any[], point: any) {
    // u ovoj metodi vodjeno je racuna da li su tacke translirane,
    // ali ne i da li su skalirane (zoom i zoomOut)

    let nearestPoint = points[0];
    let minDistance: number = this.getDistance([points[0][0] + this.translateX, points[0][1] + this.translateY], point);

    points = points.slice(1);
    points.forEach(p => {
        const distance: number = this.getDistance([p[0] + this.translateX, p[1] + this.translateY], point);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = p;
        }
    });

    return [nearestPoint[0] + this.translateX, nearestPoint[1] + this.translateY];
  }

  getDistance(p1, p2) {
    return Math.sqrt( Math.pow(p1[0] - p2[0], 2)
                    + Math.pow(p1[1] - p2[1], 2));
  }

}
