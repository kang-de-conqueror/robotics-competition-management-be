import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ImportTeamsDto } from './dto/import-teams.dto';
import { EmailsService } from '../emails/emails.service';
import { TeamStatus, UserRole, Prisma } from 'generated/prisma';

interface TeamData {
  name: string;
  organization?: string;
  description?: string;
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  private async createUsersByEmails(emails: string[]) {
    let users = await this.prismaService.user.findMany({
      where: { email: { in: emails } },
    });

    const existingUserEmails = users.map((user) => user.email);
    const notExistingUserEmails = emails.filter(
      (email) => !existingUserEmails.includes(email),
    );

    if (notExistingUserEmails.length > 0) {
      const newUsers = await Promise.all(
        notExistingUserEmails.map(
          async (email) =>
            await this.authService.createUser({
              email,
              password: '',
              role: UserRole.USER,
            }),
        ),
      );
      users = [...users, ...newUsers];
    }

    return users;
  }

  async createTeam(createTeamDto: CreateTeamDto) {
    let tournamentName = '';

    const newTeam = await this.prismaService.$transaction(async (prisma) => {
      const tournament = await prisma.tournament.findUnique({
        where: { id: createTeamDto.tournamentId },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      tournamentName = tournament.name;

      const users = await this.createUsersByEmails(createTeamDto.memberEmails);
      const userIds = users.map((user) => user.id);
      const existingTeams = await prisma.team.findMany({
        where: {
          teamMembers: { some: { id: { in: userIds } } },
          tournamentId: createTeamDto.tournamentId,
        },
      });
      if (existingTeams.length > 0) {
        throw new Error(
          'Some users are already in a team that has joined this tournament',
        );
      }

      return await prisma.team.create({
        data: {
          name: createTeamDto.name,
          description: createTeamDto.description,
          leaderId: createTeamDto.leaderId,
          organization: createTeamDto.organization,
          province: createTeamDto.organization,
          teamMembers: {
            connect: users.map((user) => ({ id: user.id })),
          },
          tournamentId: createTeamDto.tournamentId,
        },
        include: {
          teamMembers: true,
        },
      });
    });

    createTeamDto.memberEmails.forEach(async (email) => {
      await this.emailsService.sendTeamAssignmentInvitationEmail(
        email,
        createTeamDto.name,
        tournamentName,
      );
    });

    return newTeam;
  }

  async findAll(tournamentId?: string) {
    const where = tournamentId ? { tournamentId } : {};

    return this.prismaService.team.findMany({
      where,
      orderBy: {
        //teamNumber: 'asc',
      },
    });
  }

  /*async findOne(id: string) {
    const team = await this.prismaService.team.findUnique({
      where: { id },
      include: {
        tournament: true,
        teamAlliances: {
          include: {
            alliance: {
              include: {
                match: {
                  include: {
                    stage: {
                      include: { tournament: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return team;
  }*/

  async updateTeam(id: string, updateTeamDto: UpdateTeamDto) {
    return await this.prismaService.$transaction(async (prisma) => {
      const team = await prisma.team.findUnique({
        where: { id },
        include: { teamMembers: true },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      if (team.status !== TeamStatus.PENDING) {
        throw new Error('Only teams with PENDING status can be updated');
      }

      const tournament = await prisma.tournament.findUnique({
        where: { id: team.tournamentId },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const { memberEmails, ...rest } = updateTeamDto;

      const data: Prisma.TeamUpdateInput = Object.fromEntries(
        Object.entries(rest).filter(([_, v]) => v !== undefined),
      );

      if (memberEmails !== undefined) {
        const users = await this.createUsersByEmails(memberEmails);
        data.teamMembers = {
          disconnect: team.teamMembers.map((member) => ({ id: member.id })),
          connect: users.map((user) => ({ id: user.id })),
        };
      }

      if (data.status === TeamStatus.PENDING) {
        const prefix = tournament.name
          .split(' ')
          .map((word) => word[0])
          .join('')
          .toUpperCase();

        const existingTeam = await prisma.team.findFirst({
          where: {
            tournamentId: tournament.id,
            teamNumber: {
              startsWith: prefix,
            },
          },
          orderBy: {
            teamNumber: 'desc',
          },
        });

        let nextNumber = 1;

        if (existingTeam?.teamNumber) {
          const numberPart =
            parseInt(existingTeam.teamNumber.replace(prefix, '')) || 0;
          nextNumber = numberPart + 1;
        }

        const paddedNumber = String(nextNumber).padStart(5, '0');
        data.teamNumber = `${prefix}${paddedNumber}`;
      }

      if (Object.keys(data).length > 0) {
        await prisma.team.update({
          where: { id },
          data,
        });
      }
    });
  }

  /*async remove(id: string) {
    await this.ensureTeamExistsById(id);
    return this.prisma.team.delete({ where: { id } });
  }

 
  async importTeams(importTeamsDto: ImportTeamsDto) {
    const {
      content,
      format,
      hasHeader = false,
      delimiter = ',',
      tournamentId,
    } = importTeamsDto;
    try {
      const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
      const dataLines = hasHeader ? lines.slice(1) : lines;
      if (dataLines.length === 0) {
        throw new BadRequestException('No team data found in the content');
      }
      const teamsToCreate: TeamData[] = dataLines.map((line) => {
        const parts = line.split(delimiter).map((part) => part.trim());
        if (!parts[0]) {
          throw new BadRequestException(
            `Invalid line format: ${line}. Expected at least team name`,
          );
        }
        return {
          name: parts[0],
          organization:
            parts[1] !== undefined && parts[1] !== '' ? parts[1] : undefined,
          description:
            parts[2] !== undefined && parts[2] !== '' ? parts[2] : undefined,
        };
      });
      const createdTeams: any[] = [];
      for (const teamData of teamsToCreate) {
        try {
          const teamNumber = await this.generateNextTeamNumber();
          await this.ensureTeamNumberUnique(teamNumber);
          const team = await this.prisma.team.create({
            data: {
              teamNumber,
              name: teamData.name,
              organization: teamData.organization,
              description: teamData.description,
              tournamentId: tournamentId || null,
            },
            include: { tournament: true },
          });
          createdTeams.push(team);
        } catch (error) {
          console.error(`Error creating team ${teamData.name}:`, error);
        }
      }
      return {
        success: true,
        message: `Successfully imported ${createdTeams.length} teams`,
        teams: createdTeams,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to import teams: ${error.message}`);
    }
  }*/
}
