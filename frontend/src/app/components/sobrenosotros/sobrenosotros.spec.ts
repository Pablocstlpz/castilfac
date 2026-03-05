import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sobrenosotros } from './sobrenosotros';

describe('Sobrenosotros', () => {
  let component: Sobrenosotros;
  let fixture: ComponentFixture<Sobrenosotros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sobrenosotros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sobrenosotros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
