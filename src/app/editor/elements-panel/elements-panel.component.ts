import { Component, OnInit, AfterContentInit, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { ContainerElement } from 'd3';
import { CanvasService } from '../canvas/service/canvas.service';
import { Stencil } from 'src/app/shared/model/stencil';
import { StencilsConfigService } from '../services/stencils-config/stencils-config.service';


@Component({
  selector: 'app-elements-panel',
  templateUrl: './elements-panel.component.html',
  styleUrls: ['./elements-panel.component.css']
})
export class ElementsPanelComponent implements OnInit, AfterViewInit, OnChanges /*AfterContentInit*/ {

  @Input() currentDiagram: string;

  private SHAPE_SIZE = 50;
  private SPACE_BETWEEN_SHAPES = 0;
  private TEXT_SIZE = 10;
  private coordinates = { x: 10, y: 10 };
  private patternImageGenerator = 0;

  svg: any;

  constructor(private canvasService: CanvasService,
              private stencilsConfigService: StencilsConfigService) {}

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.currentDiagram.firstChange) {
      if (this.currentDiagram) {
        const elements = this.svg.selectAll('g');
        elements.style('cursor', 'copy');
      }
    }
  }

  // ngAfterContentInit() {
  ngAfterViewInit() {
    // https://stackoverflow.com/questions/29687217/d3-event-x-does-not-get-the-x-cursors-position

    const that = this;

    this.svg = d3.select('svg#id_elements');

    const lineGenerator = d3.line().curve(d3.curveCardinal);

    const stencils: Stencil[] = this.stencilsConfigService.getStencils();

    const elements = this.svg.selectAll('g')
      .data(stencils)
      // .datum(graphicElements)
      .enter()
      .append('g')
      .attr('transform', function(d: any) {
         d.x = that.coordinates.x;
         d.y = that.coordinates.y;
         that.coordinates.y += that.SHAPE_SIZE + that.SPACE_BETWEEN_SHAPES;
         return 'translate(' + d.x + ' ' + d.y + ')'; })
      .classed('graphic-element', true);
      // .style('stroke', '#0000ff')
      // .style('stroke-width', '4px')
    if (this.currentDiagram) {
      elements.style('cursor', 'copy');
    }

    elements.each(function(element: any, i ) {
      const self = d3.select(this);
      let  tagName;
      if (element.tag === 'image') {
        tagName = 'circle';
      } else {
        tagName = element.tag;
      }
      const tag = self.append(tagName);

      if (element.tag !== 'image') {
          element.properties.forEach(prop => {
            tag.attr(prop.name, prop.value);
          });
      }

      /*if (element.tag === 'image') {
      tag.attr('x', element.x)
          .attr('y', element.y)
          .attr('width', that.SHAPE_SIZE)
          .attr('height', that.SHAPE_SIZE);
      }*/
      if (element.tag === 'circle'  || element.tag === 'image') {
        tag.attr('r', that.SHAPE_SIZE / 2)
          .attr('cx', element.x + that.SHAPE_SIZE / 2)
          .attr('cy', element.y + that.SHAPE_SIZE / 2);

        if (element.tag === 'image') {
          const patternId = 'id-pattern-image-' + that.patternImageGenerator++;
          const imagePath = element.properties.filter(prop => prop.name === 'xlink:href')[0].value;
          that.svg.select('defs')
                  .append('pattern')
                    .attr('id', patternId)
                    .attr('patternUnits', 'objectBoundingBox')
                    .attr('height', that.SHAPE_SIZE)
                    .attr('width', that.SHAPE_SIZE)
                    .append('image')
                      .attr('x', 0)
                      .attr('y', 0)
                      .attr('height', that.SHAPE_SIZE)
                      .attr('width', that.SHAPE_SIZE)
                      .attr('xlink:href', imagePath);
          tag.attr('fill', 'url(#' + patternId + ')');
        }
      } else if (element.tag === 'rect') {
          tag.attr('x', 10)
            .attr('y', 235)
            .attr('height', that.SHAPE_SIZE / 2)
            .attr('width', that.SHAPE_SIZE);

      } else if (element.tag === 'path') {
        /*tag.attr('x1', that.coordinates.x)
            .attr('y1', that.coordinates.y)
            .attr('x2', that.coordinates.x + 50)
            .attr('y2', that.coordinates.y)
            .style('width', '200px')
            .style('height', '100px')
            .style('border', 'solid 5px #000')
            .style('border-color', '#000 transparent transparent transparent')
            .style('border-radius', '50px 0 0 50px');*/

            /*const points: any[] = [
              [element.x, element.y],
              [element.x + 16, element.y + 30],
              // [element.x + 40, element.y + 5],
              [element.x + 50, element.y + 50]
            ];*/
            const points: any[] = [
              [element.x, element.y],
              [(element.x + element.x + that.SHAPE_SIZE) / 2, element.y],
              [element.x + that.SHAPE_SIZE, element.y]
            ];

            const pathData = lineGenerator(points);

            // self.select('path')
            tag.attr('d', pathData);

            if (element.type === 'data-flow') {
                const linkArrow = self.append('path');
                linkArrow.attr('stroke', '#ffa500')
                          .attr('stroke-width', 5)
                          // .attr('fill', 'none')
                          .attr('fill', '#ffa500');
                const pointsLinkArrow: any[] = [
                  [element.x + that.SHAPE_SIZE, element.y + 10],
                  [element.x + that.SHAPE_SIZE, element.y - 10],
                  [element.x + 10 + that.SHAPE_SIZE, element.y],
                  [element.x + that.SHAPE_SIZE, element.y + 10]
                ];
                const pathDataLinkArrow = lineGenerator(pointsLinkArrow);
                linkArrow.attr('d', pathDataLinkArrow);
            }

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

      self.append('text')
      .attr('x', element.x)
        // .attr('x', element.x + 3 * that.SHAPE_SIZE / 2)
        .attr('y', function() {
          if (element.tag === 'path') {
            return element.y + that.SHAPE_SIZE / 3;
          } else {
            return element.y + that.SHAPE_SIZE * 5 / 4;
          }
        })
        // .attr('text-anchor', 'middle')
        .attr('font-size', that.TEXT_SIZE)
        .attr('font-family', 'sans-serif')
        .attr('fill', 'green')
        .text(element.type.charAt(0).toUpperCase() + element.type.slice(1));

    });

      this.svg.on('click', function () {
        const containerElement = this as ContainerElement;
        const mouse = d3.mouse(containerElement);

        /*const newCircle = svg
                .append('img')
                .datum({x: mouse[0], y: mouse[1], selected: false})
          .attr('src', 'assets/images/dog.jpg')
          .attr('height', that.IMAGE_SIZE)
          .attr('width', that.IMAGE_SIZE)
          .style('cursor', 'copy');*/

        /*const newCircle = svg
                .append('image')
                .datum({x: mouse[0], y: mouse[1], selected: false})
          .attr('xlink:href', 'assets/images/dog.jpg')
          .attr('x', mouse[0])
          .attr('y', mouse[1])
          .attr('height', that.SHAPE_SIZE)
          .attr('width', that.SHAPE_SIZE)
          .style('cursor', 'copy');*/

        /*newCircle.on('click', function () {
            if (d3.event.ctrlKey) {
                newCircle.transition()
                    .duration(500)
                    .attr('transform', 'translate(' + newCircle.attr('cx') + ',' + newCircle.attr('cy') + ') scale(0)')
                    .remove();
            } else {
                const datum = newCircle.datum();
                if (newCircle.datum().selected) {
                    datum.selected = false;
                    newCircle
                        .datum(datum)
                        .transition()
                        .duration(500)
                        .attr('stroke', '#039BE5')
                        .attr('stroke-width', '1px');
                } else {
                    datum.selected = true;
                    newCircle
                        .datum(datum)
                        .transition()
                        .duration(500)
                        .attr('stroke', '#455A64')
                        .attr('stroke-width', '3px');
                }
            }
            d3.event.stopPropagation();
        });*/
    });

    let currentElement: any;
    let oldPosition: any;

    /*const dragHandlerSvgCanvas = d3.drag()
      .on('drag', function (d: any) {
          d3.select(this)
              .attr('x', d3.event.x)
              .attr('y', d3.event.y);
      });*/

    const dragHandlerSvgElements = d3.drag()
        .on('start', function(d: any) {
          if (that.currentDiagram) {
            // gasimo zoom (vracamo sve u normalu pre dodavanja novo elementa na canvas)
            that.canvasService.doAction(that.currentDiagram, 'zoom-out', null);

              oldPosition = { x: d.x, y: d.y };
              currentElement = d3.select(this).clone(true)
                                .classed('current-element', true)
                                .style('position', 'absolute')
                                .style('z-index', 999);
              currentElement.select('text').remove();
          }
        })
        .on('drag', function (d: any) {
          if (that.currentDiagram) {
            if (currentElement) {
              const svgElements: any = document.getElementById('id_elements');
              const pointInSvgElements = svgElements.createSVGPoint();
              /*pointInSvgElements.x = currentElement.attr('x');
              pointInSvgElements.y = currentElement.attr('y');*/
              // pointInSvgElements.x = d.x;
              // pointInSvgElements.y = d.y;
              pointInSvgElements.x = d3.event.x;
              pointInSvgElements.y = d3.event.y;

              const domCoordinates = pointInSvgElements.matrixTransform(svgElements.getScreenCTM());

              const selectCurrentSvg = '#nav-' + that.currentDiagram + ' app-canvas svg';

              const svgCanvas: any = document.querySelector(selectCurrentSvg);
              const pointInSvgCanvas: SVGPoint = svgCanvas.createSVGPoint();
              pointInSvgCanvas.x = domCoordinates.x;
              pointInSvgCanvas.y = domCoordinates.y;
              const svgCanvasPoint = pointInSvgCanvas.matrixTransform(svgCanvas.getScreenCTM().inverse());

              /*
              const svgCanvasD3 = d3.select(selectCurrentSvg);
              const svgCanvasD3WidthStr = svgCanvasD3.style('width');
              const svgCanvasD3HeightStr = svgCanvasD3.style('height');
              const svgCanvasD3Width: number = +svgCanvasD3WidthStr.substring(0, svgCanvasD3WidthStr.length - 2);
              const svgCanvasD3Height: number = +svgCanvasD3HeightStr.substring(0, svgCanvasD3HeightStr.length - 2);
              */
              const svgCanvasWidth: number = svgCanvas.clientWidth;
              const svgCanvasHeight: number = svgCanvas.clientHeight;

              if (svgCanvasPoint.x + that.SHAPE_SIZE >= 0 && svgCanvasPoint.x <= svgCanvasWidth
                  && svgCanvasPoint.y + that.SHAPE_SIZE >= 0 && svgCanvasPoint.y <= svgCanvasHeight) {
                  currentElement.style('cursor', 'copy');
              } else {
                  currentElement.style('cursor', 'not-allowed');
              }

              /*currentElement
              .attr('x', d3.event.x)
              .attr('y', d3.event.y);*/
              /*.attr('cx', d.x = d3.event.x)
                .attr('cy', d.y = d3.event.y);*/
              /*d.x = d3.event.x;
              d.y = d3.event.y;*/
              currentElement.attr('transform', function(el: any, i) {
                el.x = d3.event.x;
                el.y = d3.event.y;
                console.log('(' + el.x + ',' + el.y);
                return 'translate(' + [ el.x, el.y ] + ')';
              });
            }
          }
        })
        .on('end', function(d: any) {
          if (that.currentDiagram) {
            const svgElements: any = document.getElementById('id_elements');
            const pointInSvgElements = svgElements.createSVGPoint();
            /*pointInSvgElements.x = currentElement.attr('x');
            pointInSvgElements.y = currentElement.attr('y');*/
            pointInSvgElements.x = d.x; // - that.SHAPE_SIZE;
            pointInSvgElements.y = d.y; // - that.SHAPE_SIZE;

            const domCoordinates = pointInSvgElements.matrixTransform(svgElements.getScreenCTM());

            const selectCurrentSvg = '#nav-' + that.currentDiagram + ' app-canvas svg';

            const svgCanvas: any = document.querySelector(selectCurrentSvg);
            const pointInSvgCanvas: SVGPoint = svgCanvas.createSVGPoint();
            pointInSvgCanvas.x = domCoordinates.x;
            pointInSvgCanvas.y = domCoordinates.y;
            const svgCanvasPoint = pointInSvgCanvas.matrixTransform(svgCanvas.getScreenCTM().inverse());

            /*
              const svgCanvasD3 = d3.select(selectCurrentSvg);
              const svgCanvasD3WidthStr = svgCanvasD3.style('width');
              const svgCanvasD3HeightStr = svgCanvasD3.style('height');
              const svgCanvasD3Width: number = +svgCanvasD3WidthStr.substring(0, svgCanvasD3WidthStr.length - 2);
              const svgCanvasD3Height: number = +svgCanvasD3HeightStr.substring(0, svgCanvasD3HeightStr.length - 2);
              */
              const svgCanvasWidth: number = svgCanvas.clientWidth;
              const svgCanvasHeight: number = svgCanvas.clientHeight;

            if (svgCanvasPoint.x + that.SHAPE_SIZE >= 0 && svgCanvasPoint.x <= svgCanvasWidth
                && svgCanvasPoint.y + that.SHAPE_SIZE >= 0 && svgCanvasPoint.y <= svgCanvasHeight) {

                let xCoordinate: number;
                let yCoordinate: number;

                if (svgCanvasPoint.x <= 0) {
                  xCoordinate = 4;
                } else if (svgCanvasPoint.x + that.SHAPE_SIZE >= svgCanvasWidth) {
                  xCoordinate = svgCanvasWidth - that.SHAPE_SIZE - 10;
                } else {
                  xCoordinate = svgCanvasPoint.x;
                }

                if (svgCanvasPoint.y <= 0) {
                  yCoordinate = 0;
                } else if (svgCanvasPoint.y + that.SHAPE_SIZE >= svgCanvasHeight) {
                  yCoordinate = svgCanvasHeight - that.SHAPE_SIZE - 5;
                } else {
                  yCoordinate = svgCanvasPoint.y;
                }

                /*d3.select('svg#id_canvas')
                      .append('image')
                      .datum({x: mouse[0], y: mouse[1], selected: false})
                      .attr('xlink:href', 'assets/images/dog.jpg')
                      .attr('x', xCoordinate)
                      .attr('y', yCoordinate)
                      .attr('height', that.IMAGE_SIZE)
                      .attr('width', that.IMAGE_SIZE)
                      .classed('zoom-element', true);

                      // dragHandlerSvgCanvas(d3.selectAll('svg#id_canvas image'));*/
                const data = currentElement.data()[0];
                if (data.tag === 'image') {
                  yCoordinate += that.SHAPE_SIZE;
                } else if (data.tag === 'path') {
                  yCoordinate += 2 * that.SHAPE_SIZE;
                }

                that.canvasService.doAction(that.currentDiagram, 'add-new-graphic-element',
                  { id: -1, stencilId: data.id, position: { x: xCoordinate, y: yCoordinate },
                      idOfData: null }
                );
            }

            // vracamo <g> na staru poziciju
            currentElement.attr('transform', function(el: any, i) {
              el.x = oldPosition.x;
              el.y = oldPosition.y;
              console.log('(' + el.x + ',' + el.y);
              return 'translate(' + [ el.x, el.y ] + ')';
            });
            currentElement.remove();
            oldPosition = null;
            currentElement = null;
          }
        });

    dragHandlerSvgElements(d3.selectAll('.graphic-element'));
  }

}
