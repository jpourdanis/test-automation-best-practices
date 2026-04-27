// src/schemas/color.ts
import { z } from "zod";
var STRICT_NAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9 +]*[a-zA-Z0-9])?$/;
var STRICT_NAME_MSG = "name must contain alphanumeric characters and spaces only, and at least one alphanumeric character";
var ColorSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});
var CreateColorSchema = z.object({
  name: z.string().regex(STRICT_NAME_REGEX, STRICT_NAME_MSG),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "hex must be a valid 6-digit hex format (e.g., #1abc9c)")
}).strict();
var UpdateColorSchema = z.object({
  name: z.string().regex(STRICT_NAME_REGEX, STRICT_NAME_MSG).optional(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "hex must be a valid 6-digit hex format").optional()
}).strict().refine((data) => data.name !== void 0 || data.hex !== void 0, {
  message: "At least one field to update must be provided"
});

// src/api/client.ts
function createApiClient(options = {}) {
  const base = options.baseUrl ?? "";
  return {
    getColors() {
      return fetch(`${base}/api/colors`);
    },
    getColor(name) {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { cache: "no-store" });
    },
    createColor(body) {
      return fetch(`${base}/api/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    },
    updateColor(name, body) {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    },
    deleteColor(name) {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { method: "DELETE" });
    }
  };
}
var apiClient = createApiClient();
export {
  ColorSchema,
  CreateColorSchema,
  STRICT_NAME_MSG,
  STRICT_NAME_REGEX,
  UpdateColorSchema,
  apiClient,
  createApiClient
};
