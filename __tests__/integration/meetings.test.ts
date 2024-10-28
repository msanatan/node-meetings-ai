import request from "supertest";
import app from "../../src/app.js";
import { connectDB, disconnectDB } from "../../src/db.js";
import { generateToken } from "../../src/utils/token.js";

let authToken: string | null = null;

beforeAll(async () => {
  await connectDB();
  // Set the JWT secret to the environment variable so the auth middleware will work
  process.env.JWT_SECRET = "test-secret";
  authToken = generateToken("user5", process.env.JWT_SECRET);
});

afterAll(async () => {
  await disconnectDB();
});

describe("Meetings", () => {
  let meetingId: string;
  test("that you get nothing when there are no meetings", async () => {
    const response = await request(app)
      .get("/api/meetings")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toEqual(0);
  });

  test("that you can create a new meeting", async () => {
    const response = await request(app)
      .post("/api/meetings")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Meeting",
        date: new Date().toISOString(),
        participants: ["Alice", "Bob"],
      });
    expect(response.status).toBe(201);
    meetingId = response.body._id;
  });

  test("that you get the newly created meeting", async () => {
    const response = await request(app)
      .get("/api/meetings")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toEqual(1);
    expect(data[0].title).toEqual("Test Meeting");
    expect(data[0].participants).toEqual(["Alice", "Bob"]);
  });

  test("should retrieve a specific meeting by ID", async () => {
    const res = await request(app)
      .get(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("meeting");
    expect(res.body.meeting).toHaveProperty("_id", meetingId);
    expect(res.body).toHaveProperty("tasks");
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test("should update the meeting transcript", async () => {
    const res = await request(app)
      .put(`/api/meetings/${meetingId}/transcript`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        transcript: "This is the meeting transcript.",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty(
      "transcript",
      "This is the meeting transcript."
    );
  });

  test("should summarize the meeting and create tasks", async () => {
    const res = await request(app)
      .post(`/api/meetings/${meetingId}/summarize`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("actionItems");
    expect(res.body).toHaveProperty("createdTasks");
    expect(res.body.createdTasks.length).toBeGreaterThan(0);
  });

  test("should prevent accessing another user's meeting", async () => {
    // "Create" another user
    const otherAuthToken = generateToken("user2", process.env.JWT_SECRET!);

    const res = await request(app)
      .get(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message", "Meeting not found");
  });
});
