import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserRole } from 'generated/prisma';

export const signUpDto = z.object({
  email: z.string().email('Email must be a valid email'),
  password: z.string().min(6, 'Password must be at least 8 characters long'),
  role: z.optional(z.enum(Object.values(UserRole) as [string, ...string[]])),
});

export class SignUpDto extends createZodDto(signUpDto) {}
