import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { FamilyMemberService } from '../services/family-member.service';
import { CreateFamilyMemberDto } from '../dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from '../dto/update-family-member.dto';
import { FamilyMemberEntity } from '../entities/family-member.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Family Member Controller
 *
 * REST API endpoints for managing family members.
 *
 * Base path: /api/v1/family-members
 *
 * All endpoints require JWT authentication.
 */
@ApiTags('Family Members')
@ApiBearerAuth()
@Controller('family-members')
@UseGuards(JwtAuthGuard)
export class FamilyMemberController {
  constructor(private readonly familyMemberService: FamilyMemberService) {}

  /**
   * POST /api/v1/family-members
   * Create a new family member
   */
  @Post()
  @ApiOperation({ summary: 'Create a new family member' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Family member created successfully',
    type: FamilyMemberEntity,
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
    @Body() dto: CreateFamilyMemberDto,
    @CurrentUser() user: JwtPayload
  ): Promise<FamilyMemberEntity> {
    return await this.familyMemberService.create(user.userId, dto);
  }

  /**
   * GET /api/v1/family-members
   * Get all family members for the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all family members' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of family members',
    type: [FamilyMemberEntity],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async findAll(
    @CurrentUser() user: JwtPayload
  ): Promise<FamilyMemberEntity[]> {
    return await this.familyMemberService.findAll(user.userId);
  }

  /**
   * GET /api/v1/family-members/:id
   * Get a single family member by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a family member by ID' })
  @ApiParam({
    name: 'id',
    description: 'Family member UUID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Family member details',
    type: FamilyMemberEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Family member not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<FamilyMemberEntity> {
    return await this.familyMemberService.findOne(user.userId, id);
  }

  /**
   * PATCH /api/v1/family-members/:id
   * Update an existing family member
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a family member' })
  @ApiParam({
    name: 'id',
    description: 'Family member UUID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Family member updated successfully',
    type: FamilyMemberEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Family member not found',
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
    @Body() dto: UpdateFamilyMemberDto,
    @CurrentUser() user: JwtPayload
  ): Promise<FamilyMemberEntity> {
    return await this.familyMemberService.update(user.userId, id, dto);
  }

  /**
   * DELETE /api/v1/family-members/:id
   * Soft delete a family member
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a family member' })
  @ApiParam({
    name: 'id',
    description: 'Family member UUID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Family member deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Family member not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete last family member',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<void> {
    await this.familyMemberService.remove(user.userId, id);
  }
}
