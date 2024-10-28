import request from "supertest";
import app from "../../src/app.js";
import { connectDB, disconnectDB } from "../../src/db.js";

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe("Meetings", () => {
  it("should get all meetings", async () => {
    const response = await request(app).get("/api/meetings");
    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toEqual(0);
  });
});
