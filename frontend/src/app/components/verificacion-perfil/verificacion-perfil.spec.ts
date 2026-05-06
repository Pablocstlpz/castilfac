import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificacionPerfil } from './verificacion-perfil';

describe('VerificacionPerfil', () => {
  let component: VerificacionPerfil;
  let fixture: ComponentFixture<VerificacionPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificacionPerfil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificacionPerfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
