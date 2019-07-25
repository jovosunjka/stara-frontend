import { TestBed } from '@angular/core/testing';

import { GraphicElementsConfigService } from './graphic-elements-config.service';

describe('GraphicElementsConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GraphicElementsConfigService = TestBed.get(GraphicElementsConfigService);
    expect(service).toBeTruthy();
  });
});
