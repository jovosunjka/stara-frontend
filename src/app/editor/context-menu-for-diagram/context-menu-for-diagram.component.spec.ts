import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContextMenuForDiagramComponent } from './context-menu-for-diagram.component';

describe('ContextMenuForDiagramComponent', () => {
  let component: ContextMenuForDiagramComponent;
  let fixture: ComponentFixture<ContextMenuForDiagramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContextMenuForDiagramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContextMenuForDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
