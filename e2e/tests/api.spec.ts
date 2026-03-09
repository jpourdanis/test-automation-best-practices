import { test, expect } from "@playwright/test";
import { z } from "zod";

const ColorSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
test.describe("Backend API Integration", () => {
  const expectedColors = [
    { name: "Turquoise", hex: "#1abc9c" },
    { name: "Red", hex: "#e74c3c" },
    { name: "Yellow", hex: "#f1c40f" },
  ];

  for (const color of expectedColors) {
    test(`GET /api/colors/${color.name} should return the correct hex code`, async ({ request }) => {
      const response = await request.get(`/api/colors/${color.name}`);
      
      // Verify HTTP status code
      expect(response.status()).toBe(200);

      // Verify content type
      expect(response.headers()["content-type"]).toContain("application/json");

      // Parse the JSON payload
      const data = await response.json();

      // Verify exact object schema using Zod
      ColorSchema.parse(data);

      expect(data).toEqual(
        expect.objectContaining({ name: color.name, hex: color.hex })
      );
    });
  }

  test("GET /api/colors should return all colors", async ({ request }) => {
    const response = await request.get(`/api/colors`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThanOrEqual(3);
  });

  test("GET /api/colors/:name should return 404 for non-existent color", async ({ request }) => {
    const response = await request.get(`/api/colors/DoesNotExist`);
    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Color not found");
  });

  test.describe("POST /api/colors Schema Validation", () => {
    test("should create a new color with valid schema", async ({ request }) => {
      const newColor = { name: "Orange", hex: "#ffa500" };
      const response = await request.post(`/api/colors`, { data: newColor });
      expect(response.status()).toBe(201);
      
      const data = await response.json();
      ColorSchema.parse(data);
      expect(data).toEqual(expect.objectContaining(newColor));

      // Cleanup
      await request.delete(`/api/colors/${newColor.name}`);
    });

    test("should return 409 for duplicate color creation", async ({ request }) => {
      const color = { name: "DuplicateColor", hex: "#111111" };
      await request.post(`/api/colors`, { data: color });
      
      const response = await request.post(`/api/colors`, { data: color });
      expect(response.status()).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('Color "DuplicateColor" already exists');
      
      await request.delete(`/api/colors/${color.name}`);
    });

    test("should reject missing name", async ({ request }) => {
      const response = await request.post(`/api/colors`, { data: { hex: "#ffa500" } });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid input: expected string, received undefined");
    });

    test("should reject empty name", async ({ request }) => {
      const response = await request.post(`/api/colors`, { data: { name: "", hex: "#ffa500" } });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("name cannot be empty");
    });

    test("should reject missing hex", async ({ request }) => {
      const response = await request.post(`/api/colors`, { data: { name: "Orange" } });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid input: expected string, received undefined");
    });

    test("should reject invalid hex format", async ({ request }) => {
      const response = await request.post(`/api/colors`, { data: { name: "Orange", hex: "ffa500" } });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("hex must be a valid 6-digit hex format");
    });
  });

  test.describe("PUT /api/colors/:name Schema Validation", () => {
    test("should update a color with valid schema", async ({ request }) => {
      const tempColor = { name: "TempUpdate", hex: "#112233" };
      await request.post(`/api/colors`, { data: tempColor });

      const updateData = { hex: "#332211" };
      const response = await request.put(`/api/colors/${tempColor.name}`, { data: updateData });
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      ColorSchema.parse(data);
      expect(data.hex).toBe(updateData.hex);

      // Cleanup
      await request.delete(`/api/colors/${tempColor.name}`);
    });

    test("should reject invalid hex format on update", async ({ request }) => {
      const response = await request.put(`/api/colors/Turquoise`, { data: { hex: "112233" } });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("hex must be a valid 6-digit hex format");
    });

    test("should reject updating with empty name", async ({ request }) => {
      const response = await request.put(`/api/colors/Turquoise`, { data: { name: "" } });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("name cannot be empty");
    });

    test("should reject omitting both name and hex on update", async ({ request }) => {
      const response = await request.put(`/api/colors/Turquoise`, { data: {} });
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("At least one field to update must be provided");
    });

    test("should return 404 when updating non-existent color", async ({ request }) => {
      const response = await request.put(`/api/colors/DoesNotExist`, { data: { hex: "#222222" } });
      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Color not found");
    });
  });

  test.describe("DELETE /api/colors/:name", () => {
    test("should delete an existing color", async ({ request }) => {
      const color = { name: "ToDelete", hex: "#333333" };
      await request.post(`/api/colors`, { data: color });
      
      const response = await request.delete(`/api/colors/${color.name}`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Color "ToDelete" deleted successfully');
    });

    test("should return 404 for non-existent color deletion", async ({ request }) => {
      const response = await request.delete(`/api/colors/DoesNotExist`);
      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Color not found");
    });
  });
});
