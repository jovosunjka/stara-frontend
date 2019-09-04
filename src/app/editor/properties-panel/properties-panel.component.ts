import { Component, OnInit, Input } from '@angular/core';
import { PropertiesService } from './service/properties.service';
import { RunLevel } from 'src/app/shared/model/enum/run-level.enum';

@Component({
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.css']
})
export class PropertiesPanelComponent implements OnInit {

  @Input()
  currentDiagram: string;

  selectedElement: any;

  private excludePropertyNames = ['id', 'source', 'destination'];

  constructor(private propertiesService: PropertiesService) { }

  ngOnInit() {
    this.propertiesService.selectedElementEvent.subscribe(
      (selectedElement: any) => {
        this.selectedElement = selectedElement;
        console.log('Selected element:');
        console.log(selectedElement);
      }
    );
  }

  getKeys() {
    return Object.keys(this.selectedElement);
  }

  refreshCanvas() {
    this.propertiesService.refreshCanvas(this.currentDiagram, this.selectedElement.id);
  }

  checkProperty(name: string, value: any) {
    if (Array.isArray(value)) {
      return false;
    }

    if (this.excludePropertyNames.includes(name)) {
      return false;
    }

    return true;
  }

  inputType(value: any) {
    if (typeof value === 'boolean') {
      return 'checkbox';
    } else if (this.getRunLevels().includes(value)) {
      return 'select';
    }
    return 'text';
  }

  getRunLevels() {
    return Object.keys(RunLevel).filter((k: string) => isNaN(+k));
  }

}
