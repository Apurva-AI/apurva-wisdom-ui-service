import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingActionMenuComponent } from './floating-action-menu.component';

describe('FloatingActionMenuComponent', () => {
  let component: FloatingActionMenuComponent;
  let fixture: ComponentFixture<FloatingActionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FloatingActionMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingActionMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
