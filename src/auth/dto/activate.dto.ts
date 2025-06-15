import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const activateDto = z.object({
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Password must be at least 6 characters long',
    }),
  token: z.string().min(1, 'Token is required'),
});

export class ActivateDto extends createZodDto(activateDto) {}
