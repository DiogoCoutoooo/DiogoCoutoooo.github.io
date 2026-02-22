import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const htb = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/htb" }),
  schema: z.object({
    title: z.string(),
    os: z.enum(['Linux', 'Windows']),
    difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Insane']),
    pwnedDate: z.string(),
    avatar: z.string(),
    matrix: z.object({
      ENUM: z.number(),
      REAL: z.number(),
      CVE: z.number(),
      CUSTOM: z.number(),
      CTF: z.number(),
    }),
    description: z.string().optional(),
  }),
});

export const collections = {
  htb: htb,
};
