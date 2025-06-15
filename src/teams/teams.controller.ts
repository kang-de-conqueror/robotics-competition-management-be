import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ImportTeamsDto } from './dto/import-teams.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'generated/prisma';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createTeam(@Body() createTeamDto: CreateTeamDto) {
    try {
      await this.teamsService.createTeam(createTeamDto);
      return {
        message: 'Created team successfully',
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  @Get()
  async findAll(@Query('tournamentId') tournamentId?: string) {
    return await this.teamsService.findAll(tournamentId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    try {
      await this.teamsService.updateTeam(id, updateTeamDto);
      console.log(updateTeamDto);
      return {
        message: 'Updated team successfully',
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
