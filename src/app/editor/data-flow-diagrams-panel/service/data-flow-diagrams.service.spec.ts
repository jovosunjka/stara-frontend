import { TestBed } from '@angular/core/testing';

import { DataFlowDiagramsService } from './data-flow-diagrams.service';

describe('DataFlowDiagramsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DataFlowDiagramsService = TestBed.get(DataFlowDiagramsService);
    expect(service).toBeTruthy();
  });
});
