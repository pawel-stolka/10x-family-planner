import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateRecurringCommitmentRequest,
  QueryRecurringCommitmentsParams,
  RecurringCommitment,
  UpdateRecurringCommitmentRequest,
} from '../models/recurring-commitment.model';

@Injectable({ providedIn: 'root' })
export class CommitmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/recurring-commitments';

  create(
    request: CreateRecurringCommitmentRequest
  ): Observable<RecurringCommitment> {
    return this.http.post<RecurringCommitment>(this.apiUrl, request);
  }

  list(params?: QueryRecurringCommitmentsParams): Observable<RecurringCommitment[]> {
    let httpParams = new HttpParams();
    if (params?.familyMemberId) {
      httpParams = httpParams.set('familyMemberId', params.familyMemberId);
    }
    if (params?.dayOfWeek) {
      httpParams = httpParams.set('dayOfWeek', String(params.dayOfWeek));
    }
    return this.http.get<RecurringCommitment[]>(this.apiUrl, { params: httpParams });
  }

  getById(commitmentId: string): Observable<RecurringCommitment> {
    return this.http.get<RecurringCommitment>(`${this.apiUrl}/${commitmentId}`);
  }

  update(
    commitmentId: string,
    request: UpdateRecurringCommitmentRequest
  ): Observable<RecurringCommitment> {
    return this.http.patch<RecurringCommitment>(
      `${this.apiUrl}/${commitmentId}`,
      request
    );
  }

  delete(commitmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commitmentId}`);
  }
}

