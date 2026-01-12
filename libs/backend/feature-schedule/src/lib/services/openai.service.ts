import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

/**
 * OpenAI Service
 * 
 * Handles communication with OpenAI API for AI-powered schedule generation.
 * Uses GPT-4 Turbo to analyze family members, recurring goals, and generate
 * optimized weekly schedules.
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - OPENAI_MODEL: Model to use (default: gpt-4-turbo-preview)
 * - OPENAI_MAX_TOKENS: Maximum response tokens (default: 2000)
 * - OPENAI_TEMPERATURE: Creativity level 0-1 (default: 0.7)
 */
@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor() {
    const apiKey = process.env['OPENAI_API_KEY'];
    
    if (!apiKey) {
      this.logger.warn('⚠️  OPENAI_API_KEY not found in environment variables');
      this.logger.warn('⚠️  AI schedule generation will not work without API key');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key', // Fallback to prevent crash
    });

    this.model = process.env['OPENAI_MODEL'] || 'gpt-4-turbo-preview';
    this.maxTokens = parseInt(process.env['OPENAI_MAX_TOKENS'] || '2000', 10);
    this.temperature = parseFloat(process.env['OPENAI_TEMPERATURE'] || '0.7');

    this.logger.log(`✅ OpenAI Service initialized with model: ${this.model}`);
  }

  /**
   * Generate weekly schedule using GPT-4
   * 
   * Takes family context and returns structured time blocks for the week.
   * 
   * @param params - Generation parameters
   * @returns Array of time block definitions
   */
  async generateSchedule(params: {
    weekStartDate: Date;
    familyMembers: Array<{
      id: string;
      name: string;
      role: string;
      age?: number;
    }>;
    recurringGoals: Array<{
      id: string;
      name: string;
      description?: string;
      frequencyPerWeek: number;
      preferredDurationMinutes: number;
      preferredTimeOfDay?: string;
      priority: string;
      familyMemberId: string;
    }>;
    strategy?: string;
  }): Promise<Array<{
    title: string;
    blockType: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
    day: string;
    startTime: string;
    endTime: string;
    familyMemberId: string;
    notes?: string;
  }>> {
    this.logger.log(`🤖 Generating schedule for week starting ${params.weekStartDate.toISOString()}`);
    this.logger.log(`📊 Context: ${params.familyMembers.length} members, ${params.recurringGoals.length} goals`);

    try {
      const prompt = this.buildPrompt(params);
      
      this.logger.debug('📝 Sending prompt to OpenAI...');
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }, // Force JSON response
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      this.logger.debug('✅ Received response from OpenAI');
      this.logger.debug(`📊 Tokens used: ${completion.usage?.total_tokens || 'unknown'}`);

      // Parse JSON response
      const parsedResponse = this.parseScheduleResponse(responseContent);
      
      this.logger.log(`✅ Successfully generated ${parsedResponse.length} time blocks`);
      
      return parsedResponse;
    } catch (error) {
      this.logger.error('❌ Error generating schedule with OpenAI:', error);
      
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
      }
      
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      
      throw new Error(`Failed to generate schedule: ${error.message}`);
    }
  }

  /**
   * Build the prompt for GPT-4
   */
  private buildPrompt(params: {
    weekStartDate: Date;
    familyMembers: Array<any>;
    recurringGoals: Array<any>;
    strategy?: string;
  }): string {
    const weekEnd = new Date(params.weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const familyMembersText = params.familyMembers
      .map(m => `  - ${m.name} (${m.role}${m.age ? `, age ${m.age}` : ''})`)
      .join('\n');

    const goalsText = params.recurringGoals
      .map(g => {
        const member = params.familyMembers.find(m => m.id === g.familyMemberId);
        return `  - ${g.name} (${member?.name}): ${g.frequencyPerWeek}x/week, ${g.preferredDurationMinutes} min, ${g.preferredTimeOfDay || 'flexible'} time, ${g.priority} priority`;
      })
      .join('\n');

    return `Generate a weekly schedule for the following family:

**Week:** ${params.weekStartDate.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}
**Strategy:** ${params.strategy || 'balanced'}

**Family Members:**
${familyMembersText}

**Recurring Goals:**
${goalsText}

**Requirements:**
1. Schedule ALL goals exactly ${params.recurringGoals.reduce((sum, g) => sum + g.frequencyPerWeek, 0)} times total across the week
2. Respect time preferences (MORNING: 6-12am, AFTERNOON: 12-5pm, EVENING: 5-10pm)
3. Distribute goals evenly across days (avoid cramming all on one day)
4. Consider priority levels (HIGH first, then MEDIUM, then LOW)
5. Avoid overlapping blocks for same family member
6. Balance workload across days
7. Each block must be realistic (start before end)

**Return format:** JSON object with "timeBlocks" array containing:
- title: string (goal name)
- blockType: "WORK" | "ACTIVITY" | "MEAL" | "OTHER"
- day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
- startTime: "HH:MM" (24h format)
- endTime: "HH:MM" (24h format)
- familyMemberId: string (from family members above)
- notes: string (why scheduled here, optional)

Example:
{
  "timeBlocks": [
    {
      "title": "Morning Run",
      "blockType": "ACTIVITY",
      "day": "monday",
      "startTime": "07:00",
      "endTime": "07:45",
      "familyMemberId": "member-id",
      "notes": "Scheduled in morning as preferred, allows cool morning air"
    }
  ]
}`;
  }

  /**
   * System prompt defining GPT-4's role
   */
  private getSystemPrompt(): string {
    return `You are an expert family schedule optimizer AI assistant. Your job is to create realistic, balanced weekly schedules for families.

Key principles:
- Be practical: Real families have limited time and energy
- Balance: Don't overload certain days while leaving others empty
- Respect preferences: Morning people do better in mornings, etc.
- Avoid conflicts: Same person can't be in two places at once
- Be specific: Provide exact times, not ranges
- Explain: Add notes about why you scheduled things when you did

Always return valid JSON matching the requested format exactly.`;
  }

  /**
   * Parse OpenAI response into time blocks array
   */
  private parseScheduleResponse(responseContent: string): Array<{
    title: string;
    blockType: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
    day: string;
    startTime: string;
    endTime: string;
    familyMemberId: string;
    notes?: string;
  }> {
    try {
      const parsed = JSON.parse(responseContent);
      
      // Handle both { timeBlocks: [...] } and direct array formats
      const blocks = parsed.timeBlocks || parsed;
      
      if (!Array.isArray(blocks)) {
        throw new Error('Response must be an array of time blocks');
      }

      // Validate each block
      return blocks.map((block: any, index: number) => {
        if (!block.title || !block.blockType || !block.day || !block.startTime || !block.endTime || !block.familyMemberId) {
          this.logger.warn(`⚠️  Block ${index} missing required fields, skipping`);
          return null;
        }

        // Normalize day name
        const normalizedDay = block.day.toLowerCase();
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(normalizedDay)) {
          this.logger.warn(`⚠️  Block ${index} has invalid day: ${block.day}, skipping`);
          return null;
        }

        // Normalize block type
        const normalizedType = block.blockType.toUpperCase();
        const validTypes = ['WORK', 'ACTIVITY', 'MEAL', 'OTHER'];
        if (!validTypes.includes(normalizedType)) {
          this.logger.warn(`⚠️  Block ${index} has invalid blockType: ${block.blockType}, defaulting to OTHER`);
        }

        return {
          title: block.title,
          blockType: validTypes.includes(normalizedType) ? normalizedType as any : 'OTHER',
          day: normalizedDay,
          startTime: block.startTime,
          endTime: block.endTime,
          familyMemberId: block.familyMemberId,
          notes: block.notes || undefined,
        };
      }).filter(block => block !== null);
    } catch (error) {
      this.logger.error('❌ Failed to parse OpenAI response:', error);
      this.logger.debug('Response content:', responseContent);
      throw new Error('Failed to parse schedule response from AI');
    }
  }

  /**
   * Check if OpenAI service is configured and ready
   */
  isConfigured(): boolean {
    return !!process.env['OPENAI_API_KEY'];
  }
}
