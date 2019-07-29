import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { ToastrService } from 'ngx-toastr';
import { CanvasService } from '../canvas/service/canvas.service';

@Component({
  selector: 'app-context-menu-for-diagram',
  templateUrl: './context-menu-for-diagram.component.html',
  styleUrls: ['./context-menu-for-diagram.component.css']
})
export class ContextMenuForDiagramComponent implements OnInit {

  /*public items = [
    { name: 'John', otherProperty: 'Foo' },
    { name: 'Joe', otherProperty: 'Bar' }
  ];*/

  @Input() diagramId: string;

  @ViewChild('basicMenu', {static: false}) public basicMenu: ContextMenuComponent;

  constructor(private canvasService: CanvasService, private toastr: ToastrService) { }

  ngOnInit() {
  }

  delete(item: any)  {
    this.canvasService.doAction(this.diagramId, 'remove-graphic-element',
                               {type: item.type, index: item.index});
    this.toastr.info('Delete action');
  }

  copy(item: any)  {
    this.toastr.info('Copy action');
  }

  cut(item: any)  {
    this.toastr.info('Cut action');
  }

  showProperties(item: any)  {
    this.toastr.info('Properties action');
  }

  getDashes(length: number) {
    let dashes = '';
    for (let i = 0; i < length; i++) {
      dashes += '-';
    }
    return dashes;
  }
}
