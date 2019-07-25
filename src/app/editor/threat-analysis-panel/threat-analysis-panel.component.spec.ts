import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatAnalysisPanelComponent } from './threat-analysis-panel.component';

describe('ThreatAnalysisPanelComponent', () => {
  let component: ThreatAnalysisPanelComponent;
  let fixture: ComponentFixture<ThreatAnalysisPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThreatAnalysisPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatAnalysisPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
