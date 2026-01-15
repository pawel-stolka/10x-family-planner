import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GenerateScheduleRequest,
  ScheduleGenerationResponse,
} from '../models/schedule-generator.models';

@Injectable()
export class ScheduleGeneratorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/schedule-generator';

  generateSchedule(
    payload: GenerateScheduleRequest
  ): Observable<ScheduleGenerationResponse> {
    return this.http.post<ScheduleGenerationResponse>(this.apiUrl, payload);
  }
}
