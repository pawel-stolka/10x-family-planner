import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RecurringCommitmentService } from '../services/recurring-commitment.service';
import { CreateRecurringCommitmentDto } from '../dto/create-recurring-commitment.dto';
import { UpdateRecurringCommitmentDto } from '../dto/update-recurring-commitment.dto';
import { QueryRecurringCommitmentsDto } from '../dto/query-recurring-commitments.dto';
import { RecurringCommitmentEntity } from '../entities/recurring-commitment.entity';

/**
 * Recurring Commitments Controller
 *
 * Base path: /api/v1/recurring-commitments
 * All endpoints require JWT authentication.
 */
@ApiTags('Recurring Commitments')
@ApiBearerAuth()
@Controller('v1/recurring-commitments')
@UseGuards(JwtAuthGuard)
export class RecurringCommitmentController {
  constructor(private readonly service: RecurringCommitmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring commitment' })
  @ApiResponse({ status: 201, type: RecurringCommitmentEntity })
  async create(
    @Body() dto: CreateRecurringCommitmentDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringCommitmentEntity> {
    return await this.service.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List recurring commitments' })
  @ApiResponse({ status: 200, type: [RecurringCommitmentEntity] })
  async findAll(
    @Query() query: QueryRecurringCommitmentsDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringCommitmentEntity[]> {
    return await this.service.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring commitment by id' })
  @ApiResponse({ status: 200, type: RecurringCommitmentEntity })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringCommitmentEntity> {
    return await this.service.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring commitment' })
  @ApiResponse({ status: 200, type: RecurringCommitmentEntity })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringCommitmentDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RecurringCommitmentEntity> {
    return await this.service.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (soft-delete) a recurring commitment' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<void> {
    await this.service.remove(user.userId, id);
  }
}

