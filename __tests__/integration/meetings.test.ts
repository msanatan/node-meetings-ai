import request from "supertest";
import app from "../../src/app.js";
import { connectDB, disconnectDB } from "../../src/db.js";
import { generateToken } from "../../src/utils/token.js";

let authToken: string | null = null;

beforeAll(async () => {
  await connectDB();
  // Set the JWT secret
  process.env.JWT_SECRET = "test-secret";
  // Generate a token
  authToken = generateToken("user5", process.env.JWT_SECRET);
});

afterAll(async () => {
  await disconnectDB();
});

describe("Meetings", () => {
  it("should get all meetings", async () => {
    const response = await request(app)
      .get("/api/meetings")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toEqual(0);
  });
});
