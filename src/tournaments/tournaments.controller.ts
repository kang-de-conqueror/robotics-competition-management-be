import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'generated/prisma';

import { CurrentUser } from '../auth/current-user.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createTournament(@Body() createTournamentDto: CreateTournamentDto) {
    try {
      await this.tournamentsService.createTournament(createTournamentDto);
      return {
        message: 'Tournament created successfully',
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@CurrentUser() user: any) {
    return await this.tournamentsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Get(':id/fields')
  getFieldsByTournament(@Param('id') id: string) {
    return this.tournamentsService.getFieldsByTournament(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTournament(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    try {
      await this.tournamentsService.updateTournament(id, updateTournamentDto);
      return {
        message: 'Tournament updated successfully',
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteTournament(@Param('id') id: string) {
    return await this.tournamentsService.deleteTournament(id);
  }
}
