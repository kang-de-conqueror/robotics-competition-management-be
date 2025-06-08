import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createTeamDto = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  organization: z.string().optional(),
  province: z.string().optional(),
  leaderId: z.string().uuid('Leader ID must be a valid UUID'),
  memberEmails: z.array(z.string().email('Each member must be a valid email')),
  tournamentId: z.string().uuid('Tournament ID must be a valid UUID'),
});

export class CreateTeamDto extends createZodDto(createTeamDto) {}
