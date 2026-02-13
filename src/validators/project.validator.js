import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().min(1, 'Project id is required')
});

const repoUrlSchema = z
  .string()
  .min(1, 'repoUrl is required')
  .max(300, 'repoUrl is too long')
  .refine((value) => /^https?:\/\//i.test(value), 'repoUrl must be an HTTP(S) URL');

const nameSchema = z.string().min(1, 'name is required').max(120, 'name must not exceed 120 characters');
const descriptionSchema = z.string().max(2000, 'description must not exceed 2000 characters').default('');

export const createProjectSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional(),
    repoUrl: repoUrlSchema
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    repoUrl: repoUrlSchema.optional()
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field must be provided');

export const projectIdParamSchema = idParamSchema;
