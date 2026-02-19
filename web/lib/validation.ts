import { z } from 'zod';
import { PRAYER_KEYS, RAMADAN_KEYS } from './constants';

export const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(64)
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(64)
});

export const prayerUpdateSchema = z.object({
    prayer: z.enum(PRAYER_KEYS),
    value: z.boolean().optional().default(true),
    timezone: z.string().optional()
});

export const ramadanUpdateSchema = z.object({
    field: z.enum(RAMADAN_KEYS),
    value: z.boolean().optional().default(true),
    timezone: z.string().optional()
});

export const analyticsQuerySchema = z.object({
    scope: z.enum(['weekly', 'monthly', 'yearly']),
    timezone: z.string().optional()
});
