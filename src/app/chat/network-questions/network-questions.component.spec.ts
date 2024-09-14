import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NetworkQuestionsComponent } from './network-questions.component';

describe('NetworkQuestionsComponent', () => {
  let component: NetworkQuestionsComponent;
  let fixture: ComponentFixture<NetworkQuestionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NetworkQuestionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkQuestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
