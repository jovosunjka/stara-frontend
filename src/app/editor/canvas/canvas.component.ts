import { Component, OnInit, AfterContentInit, Input } from '@angular/core';
import * as d3 from 'd3';
import { CanvasService } from './service/canvas.service';
import { NewGraphicElement } from 'src/app/shared/model/new-graphic-element';

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

  private simulation: any;
  private node: any;
  private link: any;
  private nodeText: any;
  private linkText: any;

  private idGenerator = 0;

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
                name: 'Process',
                tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
              },
      x: 20,
      y: 20,
      id: this.idGenerator++
    },
    {
      element: {
            name: 'Process',
            tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
          },
      x: 100,
      y: 100,
      id: this.idGenerator++
    },
    {
      element: {
            name: 'Process',
            tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
          },
      x: 200,
      y: 100,
      id: this.idGenerator++
    },
    {
      element: {
                name: 'Process',
                tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
              },
      x: 50,
      y: 200,
      id: this.idGenerator++
    },
    {
      element: {
            name: 'Process',
            tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
          },
      x: 350,
      y: 200,
      id: this.idGenerator++
    },
    {
      element: {
            name: 'Process',
            tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
          },
      x: 100,
      y: 300,
      id: this.idGenerator++
    },
    {
      element: {
            name: 'Process',
            tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
          },
      x: 300,
      y: 300,
      id: this.idGenerator++
    },
    {
      element: {
            name: 'Process',
            tag: 'circle', properties: [{name: 'fill', value: 'blue'}]
          },
      x: 300,
      y: 250,
      id: this.idGenerator++
    }
  ];

  nodeLinks: any[] = [
    {
      element: {
        name: 'Data Flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 5
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      initialStartPosition: null,
      initialEndPosition: null,
      source: 0,
      target: 1,
      distance: 10
    },
    {
      element: {
        name: 'Data Flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 5
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      initialStartPosition: null,
      initialEndPosition: null,
      source: 1,
      target: 2,
      distance: 20
    },
    {
      element: {
        name: 'Data Flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 5
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      initialStartPosition: null,
      initialEndPosition: null,
      source: 2,
      target: 3,
      distance: 30
    },
    {
      element: {
        name: 'Data Flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 5
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      initialStartPosition: null,
      initialEndPosition: null,
      source: 3,
      target: 4,
      distance: 40
    },
    {
      element: {
        name: 'Data Flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 5
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      initialStartPosition: null,
      initialEndPosition: null,
      source: 4,
      target: 5,
      distance: 50
    },
    {
      element: {
        name: 'Data Flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 5
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      initialStartPosition: null,
      initialEndPosition: null,
      source: 5,
      target: 6,
      distance: 60
    },
    {
      element: {
        name: 'Data Flow',
        tag: 'path',
        properties: [
          {
              name: 'stroke',
              'value': '#aaa'
          },
          {
              name: 'stroke-width',
              value: 5
          },
          {
              name: 'fill',
              value: 'none'
          }
       ]
      },
      initialStartPosition: null,
      initialEndPosition: null,
      source: 6,
      target: 0,
      distance: 70
    }
  ];

  lineGenerator: any;


  constructor(private canvasService: CanvasService) {
    this.selectSvg = 'svg#id_canvas_' + CanvasComponent.svgIdIndexGenerator++;
    console.log(this.selectSvg);
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
  }

  addGraphicElement(newGraphicElement: NewGraphicElement) {
    if (newGraphicElement.tag === 'path') {
      this.nodeLinks.push({element: newGraphicElement,
                          initialStartPosition: [newGraphicElement.x, newGraphicElement.y],
                          initialEndPosition: [newGraphicElement.x + 2 * this.SHAPE_SIZE, newGraphicElement.y],
                          source: null,
                          target: null,
                          distance: 2 * this.SHAPE_SIZE
                        });
    } else {
      this.nodeData.push({element: newGraphicElement, x: newGraphicElement.x, y: newGraphicElement.y, id: this.idGenerator++});
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
              .classed('link', true);

    this.link.each(function(d: any, i) {
      const self = d3.select(this);

      d.element.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (d.element.tag === 'path') {
            let points: any[];
            if (d.source && d.target) {
              const startAndEndPoints = that.getLastPointForLink(d.source.x + that.SHAPE_SIZE / 2,
                                                                d.source.y + that.SHAPE_SIZE / 2,
                                                                d.target.x + that.SHAPE_SIZE / 2,
                                                                d.target.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              points = [
                  startPoint,
                  [startPoint[0], startPoint[1] - 10],
                  startPoint,
                  [startPoint[0], startPoint[1] + 10],
                  // [d.source.x + that.SHAPE_SIZE / 2, d.source.y + that.SHAPE_SIZE / 2],
                  [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                  // [d.target.x + that.SHAPE_SIZE / 2, d.target.y + that.SHAPE_SIZE / 2],
                  endPoint,
                  [endPoint[0], endPoint[1] - 10],
                  endPoint,
                  [endPoint[0], endPoint[1] + 10]
              ];
            } else {
              points = [d.initialEndPosition, d.initialStartPosition];
            }

            const pathData = that.lineGenerator(points);
            self.attr('d', pathData);

            // Also draw points for reference
            /*svg
              .selectAll('circle')
              .data(points)
              .enter()
              .append('circle')
              .attr('cx', function(d) {
                return d[0];
              })
              .attr('cy', function(d) {
                return d[1];
              })
              .attr('r', 3);
            */
      }

    });
    this.link = svgCanvas.selectAll(this.selectSvg + ' .link');

    this.linkText = this.linkText.data(this.nodeLinks);
    this.linkText.exit().remove();
    this.linkText = this.linkText.enter()
              .append('text')
              .attr('x', function(d: any) {
                  if (d.source && d.target) {
                    return (d.source.x + d.target.x) / 2;
                  } else {
                    return (d.initialStartPosition[0] + d.initialEndPosition[0]) / 2;
                  }
              })
              .attr('y', function(d: any) {
                  if (d.source && d.target) {
                    return (d.source.y + d.target.y) / 2;
                  } else {
                    return (d.initialStartPosition[1] + d.initialEndPosition[1]) / 2;
                  }
              })
              // .attr('text-anchor', 'middle')
              .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'green')
              .text(function(d: any) {
                  let sourceStr;
                  if (d.source) {
                    sourceStr = d.source.element.name + ' ' + d.source.id;
                  } else {
                    sourceStr = 'Unknown source node';
                  }

                  let targetStr;
                  if (d.target) {
                    targetStr =  d.target.element.name + ' ' + d.target.id;
                  } else {
                    targetStr = 'Unknown target node';
                  }

                  return sourceStr + ' - ' + targetStr;
              })
              .classed('link-text', true)
              .classed('zoom-element', true);
    this.linkText = svgCanvas.selectAll(this.selectSvg + ' text.link-text');

    // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
    const map = this.groupBy(this.nodeData);
    map.forEach((value, key) => {
        let node = svgCanvas.selectAll(this.selectSvg + ' ' + key).data(value); // value je podniz od this.nodeData
        node.exit().remove();
        node = node.enter()
              .append(key)
                .classed('zoom-element', true)
                .classed('node', true)
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

            d.element.properties.forEach(prop => {
            self.attr(prop.name, prop.value);
            });

            if (d.element.tag === 'image') {
            self.attr('x', d.x)
                .attr('y', d.y)
                .attr('width', that.SHAPE_SIZE)
                .attr('height', that.SHAPE_SIZE)
                .style('border-radius', '50%');
            } else if (d.element.tag === 'circle') {
            self.attr('r', that.SHAPE_SIZE / 2)
                .attr('cx', d.x + that.SHAPE_SIZE / 2)
                .attr('cy', d.y + that.SHAPE_SIZE / 2);
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
        .text(function(d: any) { return d.element.name + ' ' + d.id; })
        .classed('node-text', true)
        .classed('zoom-element', true);
    this.nodeText = svgCanvas.selectAll(this.selectSvg + ' text.node-text');

    d3.selectAll('.zoom-element').attr('transform', function() {
        return 'translate(' + that.translateX + ','
          + that.translateY + ') scale(' + that.scale + ')';
    });

    /*// Update and restart the this.simulation.
    this.simulation.nodes(this.nodeData);
    const forceLink: any = this.simulation.force('link');
    forceLink.links(this.nodeLinks);
    // this.simulation.alpha(1).restart();
    this.simulation.restart();*/
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
  }

  dragged(d) {
    d.x = d3.event.x;
    d.y = d3.event.y;
    this.ticked();
  }

  dragended(d) {
      // d.fixed = true;
      d.fx = null;
      d.fy = null;
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
    this.link = svgCanvas.selectAll(this.selectSvg + ' path')
              .data(this.nodeLinks)
              .enter()
              .append('path')
              .classed('link', true)
              .classed('zoom-element', true);

    this.link.each(function(d: any, i) {
      const self = d3.select(this);

      d.element.properties.forEach(prop => {
        self.attr(prop.name, prop.value);
      });

      if (d.element.tag === 'path') {
            let points: any[];
            if (d.source && d.target) {
              const startAndEndPoints = that.getLastPointForLink(d.source.x + that.SHAPE_SIZE / 2,
                                                                d.source.y + that.SHAPE_SIZE / 2,
                                                                d.target.x + that.SHAPE_SIZE / 2,
                                                                d.target.y + that.SHAPE_SIZE / 2,
                                                                that.SHAPE_SIZE / 2);
              const startPoint = startAndEndPoints.start;
              const endPoint = startAndEndPoints.end;

              points = [
                  startPoint,
                  [startPoint[0], startPoint[1] - 10],
                  startPoint,
                  [startPoint[0], startPoint[1] + 10],
                  // [d.source.x + that.SHAPE_SIZE / 2, d.source.y + that.SHAPE_SIZE / 2],
                  [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
                  // [d.target.x + that.SHAPE_SIZE / 2, d.target.y + that.SHAPE_SIZE / 2],
                  endPoint,
                  [endPoint[0], endPoint[1] - 10],
                  endPoint,
                  [endPoint[0], endPoint[1] + 10]
              ];
            } else {
              points = [d.initialEndPosition, d.initialStartPosition];
            }

            const pathData = that.lineGenerator(points);
            self.attr('d', pathData);

            // Also draw points for reference
            /*svg
              .selectAll('circle')
              .data(points)
              .enter()
              .append('circle')
              .attr('cx', function(d) {
                return d[0];
              })
              .attr('cy', function(d) {
                return d[1];
              })
              .attr('r', 3);
            */
      }

    });
    this.link = svgCanvas.selectAll(this.selectSvg + ' .link');

    this.linkText = svgCanvas.selectAll(this.selectSvg + ' text.link-text')
              .data(this.nodeLinks)
              .enter()
              .append('text')
              .attr('x', function(d: any) {
                  if (d.source && d.target) {
                    return (d.source.x + d.target.x) / 2;
                  } else {
                    return (d.initialStartPosition[0] + d.initialEndPosition[0]) / 2;
                  }
              })
              .attr('y', function(d: any) {
                  if (d.source && d.target) {
                    return (d.source.y + d.target.y) / 2;
                  } else {
                    return (d.initialStartPosition[1] + d.initialEndPosition[1]) / 2;
                  }
              })
              // .attr('text-anchor', 'middle')
              .attr('font-size', that.TEXT_SIZE)
              .attr('font-family', 'sans-serif')
              .attr('fill', 'green')
              .text(function(d: any) {
                  let sourceStr;
                  if (d.source) {
                    sourceStr = d.source.element.name + ' ' + d.source.id;
                  } else {
                    sourceStr = 'Unknown source node';
                  }

                  let targetStr;
                  if (d.target) {
                    targetStr =  d.target.element.name + ' ' + d.target.id;
                  } else {
                    targetStr = 'Unknown target node';
                  }

                  return sourceStr + ' - ' + targetStr;
            })
              .classed('link-text', true)
              .classed('zoom-element', true);

    // prvo iscrtavamo link-ove, pa onda node-ove da bi node-ovi bili iznad link-ova (lepse je ovako)
    const map = this.groupBy(this.nodeData);
    map.forEach((value, key) => {
        const node = svgCanvas.selectAll(this.selectSvg + ' ' + key).data(value) // value je podniz od this.nodeData
              .enter()
              .append(key)
                .classed('zoom-element', true)
                .classed('node', true)
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

            d.element.properties.forEach(prop => {
            self.attr(prop.name, prop.value);
            });

            if (d.element.tag === 'image') {
            self.attr('x', d.x)
                .attr('y', d.y)
                .attr('width', that.SHAPE_SIZE)
                .attr('height', that.SHAPE_SIZE);
            } else if (d.element.tag === 'circle') {
            self.attr('r', that.SHAPE_SIZE / 2)
                .attr('cx', d.x + that.SHAPE_SIZE / 2)
                .attr('cy', d.y + that.SHAPE_SIZE / 2);
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
        .text(function(d: any) { return d.element.name + ' ' + d.id; })
        .classed('node-text', true)
        .classed('zoom-element', true);

    d3.selectAll('.zoom-element').attr('transform', function() {
        return 'translate(' + that.translateX + ','
          + that.translateY + ') scale(' + that.scale + ')';
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

    /*this.link.attr('x1', function(d: any) { return d.source.element.x + that.IMAGE_SIZE / 2; })
    .attr('y1', function(d: any) { return d.source.element.y + that.IMAGE_SIZE / 2; })
    .attr('x2', function(d: any) { return d.target.element.x + that.IMAGE_SIZE / 2; })
    .attr('y2', function(d: any) { return d.target.element.y + that.IMAGE_SIZE / 2; });*/

    /*this.node.selectAll('image').attr('x', function(d: any) { return d.x; })
        .attr('y', function(d: any) { return d.y; });*/

    this.link.each(function(d: any, i) {
        let points: any[];
        if (d.source && d.target) {
          const startAndEndPoints = that.getLastPointForLink(d.source.x + that.SHAPE_SIZE / 2,
                                                            d.source.y + that.SHAPE_SIZE / 2,
                                                            d.target.x + that.SHAPE_SIZE / 2,
                                                            d.target.y + that.SHAPE_SIZE / 2,
                                                            that.SHAPE_SIZE / 2);
          const startPoint = startAndEndPoints.start;
          const endPoint = startAndEndPoints.end;

          points = [
              startPoint,
              [startPoint[0], startPoint[1] - 10],
              startPoint,
              [startPoint[0], startPoint[1] + 10],
              // [d.source.x + that.SHAPE_SIZE / 2, d.source.y + that.SHAPE_SIZE / 2],
              [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2],
              // [d.target.x + that.SHAPE_SIZE / 2, d.target.y + that.SHAPE_SIZE / 2],
              endPoint,
              [endPoint[0], endPoint[1] - 10],
              endPoint,
              [endPoint[0], endPoint[1] + 10]
          ];
        } else {
          points = [d.initialEndPosition, d.initialStartPosition];
        }

        const pathData = that.lineGenerator(points);
        d3.select(this).attr('d', pathData);
    });

    this.linkText
        .attr('x', function(d: any) {
            if (d.source && d.target) {
              return (d.source.x + d.target.x) / 2;
            } else {
              return (d.initialStartPosition[0] + d.initialEndPosition[0]) / 2;
            }
        })
        .attr('y', function(d: any) {
            if (d.source && d.target) {
              return (d.source.y + d.target.y) / 2;
            } else {
              return (d.initialStartPosition[1] + d.initialEndPosition[1]) / 2;
            }
        });

    this.node.each(function(d: any) {
        const self = d3.select(this);
        if (d.element.tag === 'image') {
          self.attr('x', function(el: any) { return el.x; })
              .attr('y', function(el: any) { return el.y; });
        } else if (d.element.tag === 'circle') {
          self.attr('cx', function(el: any) { return el.x + that.SHAPE_SIZE / 2; })
              .attr('cy', function(el: any) { return el.y + that.SHAPE_SIZE / 2; });
        }
    });

    this.nodeText.attr('x', function(d: any) { return d.x; })
              .attr('y', function(d: any) { return d.y; });

    d3.selectAll('.zoom-element').attr('transform', function() {
        return 'translate(' + that.translateX + ','
          + that.translateY + ') scale(' + that.scale + ')';
    });
  }

  groupBy(list) {
    const map = new Map();
    list.forEach((item) => {
         const key = item.element.tag;
         const collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
  }

  getLastPointForLink(x1: number, y1: number, x2: number, y2: number, r: number) {
    const z: number = Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    const a1: number = r * Math.abs(y1 - y2) / z;
    const a2: number = r * Math.abs(x1 - x2) / z;
    const b1: number = Math.sqrt( Math.pow(r, 2) - Math.pow(a1, 2));
    const b2: number = Math.sqrt( Math.pow(r, 2) - Math.pow(a2, 2));

    let xStart: number;
    if (x1 > x2) {
      xStart = x1 - a1;
    } else if (x1 < x2) {
      xStart = x1 + a1;
    } else {
      xStart = x2;
    }

    let yStart: number;
    if (y1 > y2) {
      yStart = y1 - b1;
    } else if (y1 < y2) {
      yStart = y1 + b1;
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

}
