import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureWeekView } from './feature-week-view';

describe('FeatureWeekView', () => {
  let component: FeatureWeekView;
  let fixture: ComponentFixture<FeatureWeekView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureWeekView],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureWeekView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
