import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrontendFeatureAuth } from './frontend-feature-auth';

describe('FrontendFeatureAuth', () => {
  let component: FrontendFeatureAuth;
  let fixture: ComponentFixture<FrontendFeatureAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontendFeatureAuth],
    }).compileComponents();

    fixture = TestBed.createComponent(FrontendFeatureAuth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
