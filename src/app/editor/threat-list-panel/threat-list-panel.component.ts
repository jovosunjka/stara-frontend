import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-threat-list-panel',
  templateUrl: './threat-list-panel.component.html',
  styleUrls: ['./threat-list-panel.component.css']
})
export class ThreatListPanelComponent implements OnInit {

  threatList: any[];

  constructor() {
    this.threatList = [];

    for (let i = 0; i < 9; i++) {
        this.threatList.push(
          {
            id: i,
            diagram: 'Diagram ' + i,
            state: 'State ' + i,
            title: 'Title ' + i,
            category: 'Category ' + i,
            description: 'Description ' + i,
            interaction: 'Interaction ' + i,
            priority: 'Priority ' + i,
          }
        );
    }
  }

  ngOnInit() {
  }

}
