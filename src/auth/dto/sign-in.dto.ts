import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const signInDto = z.object({
  email: z.string().email('Email must be a valid email'),
  password: z.string().min(6, 'Password must be at least 8 characters long'),
});

export class SignInDto extends createZodDto(signInDto) {}
