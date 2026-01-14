export interface RecurringCommitment {
  commitmentId: string;
  userId: string;
  familyMemberId?: string | null;
  title: string;
  blockType: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
  dayOfWeek: number; // 1=Mon ... 7=Sun
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  isShared: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringCommitmentRequest {
  familyMemberId?: string;
  title: string;
  blockType?: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isShared?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateRecurringCommitmentRequest {
  familyMemberId?: string;
  title?: string;
  blockType?: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isShared?: boolean;
  metadata?: Record<string, any>;
}

export interface QueryRecurringCommitmentsParams {
  familyMemberId?: string;
  dayOfWeek?: number;
}

