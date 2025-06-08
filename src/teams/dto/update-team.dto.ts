import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { createTeamDto } from './create-team.dto';
import { TeamStatus } from 'generated/prisma';

export const updateTeamDto = z.object({
  ...createTeamDto.partial().shape,
  status: z.optional(
    z.enum(Object.values(TeamStatus) as [string, ...string[]]),
  ),
});

export class UpdateTeamDto extends createZodDto(updateTeamDto) {}
