import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RecurringGoalService } from '../services/recurring-goal.service';
import { CreateRecurringGoalDto } from '../dto/create-recurring-goal.dto';
import { UpdateRecurringGoalDto } from '../dto/update-recurring-goal.dto';
import { QueryRecurringGoalsDto } from '../dto/query-recurring-goals.dto';
import { RecurringGoalEntity } from '../entities/recurring-goal.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Recurring Goal Controller
 *
 * REST API endpoints for managing recurring goals/activities.
 *
 * Base path: /api/v1/recurring-goals
 *
 * All endpoints require JWT authentication.
 */
@ApiTags('Recurring Goals')
@ApiBearerAuth()
@Controller('recurring-goals')
@UseGuards(JwtAuthGuard)
export class RecurringGoalController {
  constructor(private readonly goalService: RecurringGoalService) {}

  /**
   * POST /api/v1/recurring-goals
   * Create a new recurring goal
   */
  @Post()
  @ApiOperation({ summary: 'Create a new recurring goal' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Goal created successfully',
    type: RecurringGoalEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or limit exceeded',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async create(
    @Body() dto: CreateRecurringGoalDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringGoalEntity> {
    return await this.goalService.create(user.userId, dto);
  }

  /**
   * GET /api/v1/recurring-goals
   * Get all recurring goals with optional filters
   */
  @Get()
  @ApiOperation({ summary: 'Get all recurring goals' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of recurring goals',
    type: [RecurringGoalEntity],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async findAll(
    @Query() query: QueryRecurringGoalsDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringGoalEntity[]> {
    return await this.goalService.findAll(user.userId, query);
  }

  /**
   * GET /api/v1/recurring-goals/:id
   * Get a single recurring goal by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring goal by ID' })
  @ApiParam({
    name: 'id',
    description: 'Goal UUID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Goal details',
    type: RecurringGoalEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Goal not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringGoalEntity> {
    return await this.goalService.findOne(user.userId, id);
  }

  /**
   * PATCH /api/v1/recurring-goals/:id
   * Update an existing recurring goal
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring goal' })
  @ApiParam({
    name: 'id',
    description: 'Goal UUID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Goal updated successfully',
    type: RecurringGoalEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Goal not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringGoalDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringGoalEntity> {
    return await this.goalService.update(user.userId, id, dto);
  }

  /**
   * DELETE /api/v1/recurring-goals/:id
   * Soft delete a recurring goal
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recurring goal' })
  @ApiParam({
    name: 'id',
    description: 'Goal UUID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Goal deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Goal not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<void> {
    await this.goalService.remove(user.userId, id);
  }
}
