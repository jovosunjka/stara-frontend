import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatListPanelComponent } from './threat-list-panel.component';

describe('ThreatListPanelComponent', () => {
  let component: ThreatListPanelComponent;
  let fixture: ComponentFixture<ThreatListPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThreatListPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatListPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
