import { TestBed } from '@angular/core/testing';

import { StencilsConfigService } from './stencils-config.service';

describe('StencilsConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StencilsConfigService = TestBed.get(StencilsConfigService);
    expect(service).toBeTruthy();
  });
});
