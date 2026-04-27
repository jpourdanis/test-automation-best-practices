var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __hasOwnProp = Object.prototype.hasOwnProperty
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        })
  }
  return to
}
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod)

// src/index.ts
var index_exports = {}
__export(index_exports, {
  ColorSchema: () => ColorSchema,
  CreateColorSchema: () => CreateColorSchema,
  STRICT_NAME_MSG: () => STRICT_NAME_MSG,
  STRICT_NAME_REGEX: () => STRICT_NAME_REGEX,
  UpdateColorSchema: () => UpdateColorSchema,
  apiClient: () => apiClient,
  createApiClient: () => createApiClient
})
module.exports = __toCommonJS(index_exports)

// src/schemas/color.ts
var import_zod = require('zod')
var STRICT_NAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9 +]*[a-zA-Z0-9])?$/
var STRICT_NAME_MSG =
  'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
var ColorSchema = import_zod.z.object({
  name: import_zod.z.string(),
  hex: import_zod.z.string().regex(/^#[0-9A-Fa-f]{6}$/)
})
var CreateColorSchema = import_zod.z
  .object({
    name: import_zod.z.string().regex(STRICT_NAME_REGEX, STRICT_NAME_MSG),
    hex: import_zod.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'hex must be a valid 6-digit hex format (e.g., #1abc9c)')
  })
  .strict()
var UpdateColorSchema = import_zod.z
  .object({
    name: import_zod.z.string().regex(STRICT_NAME_REGEX, STRICT_NAME_MSG).optional(),
    hex: import_zod.z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'hex must be a valid 6-digit hex format')
      .optional()
  })
  .strict()
  .refine((data) => data.name !== void 0 || data.hex !== void 0, {
    message: 'At least one field to update must be provided'
  })

// src/api/client.ts
function createApiClient(options = {}) {
  const base = options.baseUrl ?? ''
  return {
    getColors() {
      return fetch(`${base}/api/colors`)
    },
    getColor(name) {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { cache: 'no-store' })
    },
    createColor(body) {
      return fetch(`${base}/api/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    },
    updateColor(name, body) {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    },
    deleteColor(name) {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { method: 'DELETE' })
    }
  }
}
var apiClient = createApiClient()
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    ColorSchema,
    CreateColorSchema,
    STRICT_NAME_MSG,
    STRICT_NAME_REGEX,
    UpdateColorSchema,
    apiClient,
    createApiClient
  })
