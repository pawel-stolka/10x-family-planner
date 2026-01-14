import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FamilyMember,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
} from '../models/family-member.model';

/**
 * Family API Service
 *
 * HTTP client for family member CRUD operations.
 * All requests are authenticated via HTTP interceptor (JWT token).
 */
@Injectable({ providedIn: 'root' })
export class FamilyApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/family-members';

  /**
   * Get all family members for the current user
   */
  getMembers(): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(this.apiUrl);
  }

  /**
   * Get a single family member by ID
   */
  getMember(id: string): Observable<FamilyMember> {
    return this.http.get<FamilyMember>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new family member
   */
  createMember(request: CreateFamilyMemberRequest): Observable<FamilyMember> {
    return this.http.post<FamilyMember>(this.apiUrl, request);
  }

  /**
   * Update an existing family member
   */
  updateMember(
    id: string,
    request: UpdateFamilyMemberRequest
  ): Observable<FamilyMember> {
    return this.http.patch<FamilyMember>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete a family member (soft delete on backend)
   */
  deleteMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
