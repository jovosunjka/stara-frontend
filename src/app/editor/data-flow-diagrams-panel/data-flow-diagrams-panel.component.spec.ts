import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFlowDiagramsPanelComponent } from './data-flow-diagrams-panel.component';

describe('DataFlowDiagramsPanelComponent', () => {
  let component: DataFlowDiagramsPanelComponent;
  let fixture: ComponentFixture<DataFlowDiagramsPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataFlowDiagramsPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataFlowDiagramsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
