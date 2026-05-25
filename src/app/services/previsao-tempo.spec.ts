import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { PrevisaoTempo } from './previsao-tempo';

describe('PrevisaoTempo', () => {
  let service: PrevisaoTempo;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(PrevisaoTempo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
