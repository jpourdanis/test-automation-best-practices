import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { z } from "zod";

const ColorSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
/**
 * Test Suite: Backend API Integration
 *
 * This suite verifies the core REST API endpoints for the Colors service.
 * it ensures that GET, POST, PUT, and DELETE operations work correctly
 * and that the data returned matches the expected schema using Zod for validation.
 *
 * This suite follows a contract-testing-lite approach by validating the
 * live API responses against the shared type definitions.
 */
test.describe("Backend API Integration", () => {
  let createdColorName: string | null = null;

  test.afterEach(async ({ request }) => {
    if (createdColorName) {
      await request.delete(`/api/colors/${createdColorName}`).catch(() => {});
      createdColorName = null;
    }
  });

  const expectedColors = [
    { name: "Turquoise", hex: "#1abc9c" },
    { name: "Red", hex: "#e74c3c" },
    { name: "Yellow", hex: "#f1c40f" },
  ];

  /**
   * Test Group: GET /api/colors/:name
   * Verifies that each seed color can be retrieved individually.
   */
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

  /**
   * Negative Test: GET /api/colors
   * Verifies that the list of all colors is returned correctly.
   */
  test("GET /api/colors should return all colors", async ({ request }) => {
    const response = await request.get(`/api/colors`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThanOrEqual(3);
  });

  /**
   * Negative Test: GET /api/colors/:name
   * Verifies that the API correctly handles requests for colors that do not exist.
   */
  test("GET /api/colors/:name should return 404 for non-existent color", async ({ request }) => {
    const response = await request.get(`/api/colors/DoesNotExist`);
    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Color not found");
  });

  /**
   * Test Group: POST /api/colors
   * Verifies the creation of new colors and strict schema validation for input data.
   */
  test.describe("POST /api/colors Schema Validation", () => {
    /**
     * Positive Test: Color Creation
     * Verifies that a valid color object can be successfully created and persisted.
     */
    test("should create a new color with valid schema", async ({ request }) => {
      const uniqueName = faker.string.alphanumeric(15);
      const newColor = { name: uniqueName, hex: "#ffa500" };
      createdColorName = newColor.name;
      const response = await request.post(`/api/colors`, { data: newColor });
      expect(response.status()).toBe(201);
      
      const data = await response.json();
      ColorSchema.parse(data);
      expect(data).toEqual(expect.objectContaining(newColor));
    });

    test("should return 409 for duplicate color creation", async ({ request }) => {
      const uniqueName = faker.string.alphanumeric(15);
      const color = { name: uniqueName, hex: "#111111" };
      createdColorName = color.name;
      await request.post(`/api/colors`, { data: color });
      
      const response = await request.post(`/api/colors`, { data: color });
      expect(response.status()).toBe(409);
      const data = await response.json();
      expect(data.error).toBe(`Color "${uniqueName}" already exists`);
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
      expect(data.error).toBe("name must contain alphanumeric characters and spaces only, and at least one alphanumeric character");
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

  /**
   * Test Group: PUT /api/colors/:name
   * Verifies that existing colors can be updated and that input validation is enforced.
   */
  test.describe("PUT /api/colors/:name Schema Validation", () => {
    /**
     * Positive Test: Color Update
     * Verifies that an existing color's properties can be updated.
     */
    test("should update a color with valid schema", async ({ request }) => {
      const uniqueName = faker.string.alphanumeric(15);
      const tempColor = { name: uniqueName, hex: "#112233" };
      createdColorName = tempColor.name;
      await request.post(`/api/colors`, { data: tempColor });

      const updateData = { hex: "#332211" };
      const response = await request.put(`/api/colors/${tempColor.name}`, { data: updateData });
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      ColorSchema.parse(data);
      expect(data.hex).toBe(updateData.hex);
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
      expect(data.error).toBe("name must contain alphanumeric characters and spaces only, and at least one alphanumeric character");
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

  /**
   * Test Group: DELETE /api/colors/:name
   * Verifies that colors can be removed from the system.
   */
  test.describe("DELETE /api/colors/:name", () => {
    /**
     * Positive Test: Color Deletion
     * Verifies that an existing color can be deleted successfully.
     */
    test("should delete an existing color", async ({ request }) => {
      const uniqueName = faker.string.alphanumeric(15);
      const color = { name: uniqueName, hex: "#333333" };
      createdColorName = color.name;
      await request.post(`/api/colors`, { data: color });
      
      const response = await request.delete(`/api/colors/${color.name}`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.message).toBe(`Color "${uniqueName}" deleted successfully`);
    });

    test("should return 404 for non-existent color deletion", async ({ request }) => {
      const response = await request.delete(`/api/colors/DoesNotExist`);
      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Color not found");
    });
  });
});
