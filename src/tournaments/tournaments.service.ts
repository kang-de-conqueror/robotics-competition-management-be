import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { create } from 'domain';

@Injectable()
export class TournamentsService {
  constructor(private prismaService: PrismaService) {}

  async createTournament(createTournamentDto: CreateTournamentDto) {
    return await this.prismaService.tournament.create({
      data: {
        name: createTournamentDto.name,
        description: createTournamentDto.description,
        startDate: new Date(createTournamentDto.startDate),
        endDate: new Date(createTournamentDto.endDate),
        adminId: createTournamentDto.adminId,
        numberOfFields: createTournamentDto.numberOfFields,
        maxTeams: createTournamentDto.maxTeams,
        maxTeamMembers: createTournamentDto.maxTeamMembers,
      },
    });
  }

  async findAll(user) {
    const tournaments = await this.prismaService.tournament.findMany({
      include: {
        teams: {
          include: {
            teamMembers: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return tournaments.map((tournament) => {
      const userTeam = user
        ? tournament.teams.find((team) =>
            team.teamMembers.some((member) => member.id === user.id),
          )
        : null;

      const { teams, ...rest } = tournament;

      return {
        ...rest,
        team: userTeam || null,
      };
    });
  }

  findOne(id: string) {
    return this.prismaService.tournament.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
        stages: {
          include: {
            matches: {
              include: {
                alliances: {
                  include: {
                    teamAlliances: {
                      include: {
                        team: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateTournament(id: string, updateTournamentDto: UpdateTournamentDto) {
    return await this.prismaService.$transaction(async (prisma) => {
      const data: Record<string, any> = {};
      let numberOfFieldsChanged = false;
      let newNumberOfFields: number | undefined;

      // Filter out undefined values and handle date parsing
      for (const [key, value] of Object.entries(updateTournamentDto)) {
        if (value !== undefined) {
          if (key === 'startDate' || key === 'endDate') {
            data[key] = new Date(value as string);
          } else if (key === 'numberOfFields') {
            data[key] = value;
            numberOfFieldsChanged = true;
            newNumberOfFields = value as number;
          } else {
            data[key] = value;
          }
        }
      }

      // Update tournament
      const updatedTournament = await prisma.tournament.update({
        where: { id },
        data,
      });

      // Handle field creation/deletion
      if (numberOfFieldsChanged && newNumberOfFields !== undefined) {
        const existingFields = await prisma.field.findMany({
          where: { tournamentId: id },
          orderBy: { number: 'asc' },
        });

        if (newNumberOfFields > existingFields.length) {
          for (let n = existingFields.length + 1; n <= newNumberOfFields; n++) {
            await prisma.field.create({
              data: {
                tournamentId: id,
                number: n,
                name: `Field ${n}`,
              },
            });
          }
        } else if (newNumberOfFields < existingFields.length) {
          const fieldsToDelete = existingFields.filter(
            (f) => f.number > newNumberOfFields,
          );
          const fieldIdsToDelete = fieldsToDelete.map((f) => f.id);

          const matchesOnFields = await prisma.match.findFirst({
            where: { fieldId: { in: fieldIdsToDelete } },
          });

          if (matchesOnFields) {
            throw new Error(
              'Cannot decrease numberOfFields: matches are assigned to fields that would be deleted. Please reassign or remove those matches first.',
            );
          }

          await prisma.field.deleteMany({
            where: { id: { in: fieldIdsToDelete } },
          });
        }
      }

      return updatedTournament;
    });
  }

  async deleteTournament(id: string) {
    return await this.prismaService.tournament.delete({
      where: { id },
    });
  }

  async getFieldsByTournament(tournamentId: string) {
    return this.prismaService.field.findMany({
      where: { tournamentId },
      orderBy: { number: 'asc' },
    });
  }
}
