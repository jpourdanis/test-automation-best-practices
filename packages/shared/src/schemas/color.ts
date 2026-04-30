import { z } from 'zod'

// Strict regex: allows spaces and +, but REQUIRES at least one letter or number
export const STRICT_NAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9 +]*[a-zA-Z0-9])?$/
export const STRICT_NAME_MSG =
  'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'

// ColorSchema validates API responses (loose — name and hex must simply be strings)
export const ColorSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
})

export type Color = z.infer<typeof ColorSchema>

// CreateColorSchema validates POST /api/colors request bodies (strict input validation).
// Note: Zod v4 removed required_error; missing fields produce the default Zod v4 message
// 'Invalid input: expected string, received undefined', which is what the tests assert.
export const CreateColorSchema = z
  .object({
    name: z.string().regex(STRICT_NAME_REGEX, STRICT_NAME_MSG),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'hex must be a valid 6-digit hex format (e.g., #1abc9c)')
  })
  .strict()

// UpdateColorSchema validates PUT /api/colors/:name request bodies (all fields optional, at least one required)
export const UpdateColorSchema = z
  .object({
    name: z.string().regex(STRICT_NAME_REGEX, STRICT_NAME_MSG).optional(),
    hex: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'hex must be a valid 6-digit hex format')
      .optional()
  })
  .strict()
  .refine((data) => data.name !== undefined || data.hex !== undefined, {
    message: 'At least one field to update must be provided'
  })
