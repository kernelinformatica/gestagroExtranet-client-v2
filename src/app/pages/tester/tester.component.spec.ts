import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesterComponent } from './tester.component';

describe('TesterComponent', () => {
  let component: TesterComponent;
  let fixture: ComponentFixture<TesterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TesterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
