import { Component, OnInit } from '@angular/core';
import { PropertiesService } from './service/properties.service';

@Component({
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.css']
})
export class PropertiesPanelComponent implements OnInit {

  selectedElement: Object;

  constructor(private propertiesService: PropertiesService) { }

  ngOnInit() {
    this.propertiesService.selectedElementEvent.subscribe(
      (selectedElement: Object) => {
        this.selectedElement = selectedElement;
        console.log('Selected element:');
        console.log(selectedElement);
      }
    );
  }

  getKeys() {
    return Object.keys(this.selectedElement);
  }

}
