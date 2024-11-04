import request from "supertest";
import app from "../../src/app.js";
import { connectDB, disconnectDB } from "../../src/db.js";
import { generateToken } from "../../src/utils/token.js";
import { Meeting } from "../../src/services/meetings/meeting.model.js";
import { Task } from "../../src/services/tasks/task.model.js";
import { TopParticipant } from "../../src/services/meetings/meeting.controller.js";

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
  test("GET /api/meetings - should get nothing when there are no meetings", async () => {
    const response = await request(app)
      .get("/api/meetings")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toEqual(0);
  });

  test("POST /api/meetings - should create a new meeting", async () => {
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

  test("GET /api/meetings - should get the newly created meeting", async () => {
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

  test("GET /api/meetings/:id - should retrieve a specific meeting by ID", async () => {
    const res = await request(app)
      .get(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("meeting");
    expect(res.body.meeting).toHaveProperty("_id", meetingId);
    expect(res.body).toHaveProperty("tasks");
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test("PUT /api/meetings/:id/transcript - should update the meeting transcript", async () => {
    const res = await request(app)
      .put(`/api/meetings/${meetingId}/transcript`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        transcript: "This is the meeting transcript.",
        endDate: new Date().toISOString(),
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty(
      "transcript",
      "This is the meeting transcript."
    );
  });

  test("POST /api/meetings/:id/summarize - should summarize the meeting and create tasks", async () => {
    const res = await request(app)
      .post(`/api/meetings/${meetingId}/summarize`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("actionItems");
    expect(res.body).toHaveProperty("createdTasks");
    expect(res.body.createdTasks.length).toBeGreaterThan(0);
  });

  test(" GET /api/meetings/:id - should prevent accessing another user's meeting", async () => {
    // "Create" another user
    const otherAuthToken = generateToken("user2", process.env.JWT_SECRET!);

    const res = await request(app)
      .get(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message", "Meeting not found");
  });
});

describe("Meetings Stats API", () => {
  beforeEach(async () => {
    await Meeting.deleteMany({ userId: "user5" });
    await Task.deleteMany({ userId: "user5" });

    const meetings = [
      {
        userId: "user5",
        title: "Meeting 1",
        date: new Date("2024-04-22T10:00:00Z"),
        endDate: new Date("2024-04-22T11:00:00Z"),
        duration: 60,
        participants: ["Alice", "Bob"],
        transcript: "Transcript 1",
        summary: "Summary 1",
        actionItems: ["Action 1"],
      },
      {
        userId: "user5",
        title: "Meeting 2",
        date: new Date("2024-04-23T11:00:00Z"),
        endDate: new Date("2024-04-23T11:30:00Z"),
        duration: 30,
        participants: ["Alice", "Charlie"],
        transcript: "Transcript 2",
        summary: "Summary 2",
        actionItems: ["Action 2"],
      },
      {
        userId: "user5",
        title: "Meeting 3",
        date: new Date("2024-04-25T09:00:00Z"),
        endDate: new Date("2024-04-25T11:00:00Z"),
        duration: 120,
        participants: ["Bob", "Charlie"],
        transcript: "Transcript 3",
        summary: "Summary 3",
        actionItems: ["Action 3"],
      },
    ];

    await Meeting.insertMany(meetings);
  });

  afterEach(async () => {
    await Meeting.deleteMany({ userId: "user5" });
    await Task.deleteMany({ userId: "user5" });
  });

  test("GET /api/meetings/stats - should retrieve meeting statistics", async () => {
    const response = await request(app)
      .get("/api/meetings/stats")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty("generalStats");
    expect(response.body.generalStats).toEqual({
      totalMeetings: 3,
      averageParticipants: 2,
      totalParticipants: 6,
      shortestMeeting: 30,
      longestMeeting: 120,
      averageDuration: 70,
    });

    expect(response.body).toHaveProperty("topParticipants");
    expect(
      response.body.topParticipants.sort(
        (a: TopParticipant, b: TopParticipant) =>
          a.participant.localeCompare(b.participant)
      )
    ).toEqual([
      { participant: "Alice", meetingCount: 2 },
      { participant: "Bob", meetingCount: 2 },
      { participant: "Charlie", meetingCount: 2 },
    ]);

    expect(response.body).toHaveProperty("meetingsByDayOfWeek");
    expect(response.body.meetingsByDayOfWeek).toEqual([
      { dayOfWeek: 1, count: 1 }, // Monday
      { dayOfWeek: 2, count: 1 }, // Tuesday
      { dayOfWeek: 3, count: 0 }, // Wednesday
      { dayOfWeek: 4, count: 1 }, // Thursday
      { dayOfWeek: 5, count: 0 }, // Friday
      { dayOfWeek: 6, count: 0 }, // Saturday
      { dayOfWeek: 7, count: 0 }, // Sunday
    ]);
  });

  test("GET /api/meetings/stats - should handle users with no meetings", async () => {
    await Meeting.deleteMany({ userId: "user5" });

    const response = await request(app)
      .get("/api/meetings/stats")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty("generalStats");
    expect(response.body.generalStats).toEqual({
      totalMeetings: 0,
      averageParticipants: 0,
      totalParticipants: 0,
      shortestMeeting: 0,
      longestMeeting: 0,
      averageDuration: 0,
    });

    expect(response.body).toHaveProperty("topParticipants");
    expect(response.body.topParticipants).toEqual([]);

    expect(response.body).toHaveProperty("meetingsByDayOfWeek");
    expect(response.body.meetingsByDayOfWeek).toEqual([
      { dayOfWeek: 1, count: 0 },
      { dayOfWeek: 2, count: 0 },
      { dayOfWeek: 3, count: 0 },
      { dayOfWeek: 4, count: 0 },
      { dayOfWeek: 5, count: 0 },
      { dayOfWeek: 6, count: 0 },
      { dayOfWeek: 7, count: 0 },
    ]);
  });

  test("GET /api/meetings/stats - should handle server errors gracefully", async () => {
    jest.spyOn(Meeting, "aggregate").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app)
      .get("/api/meetings/stats")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(500);

    expect(response.body).toEqual({ message: "Internal Server Error" });
  });
});

interface TestMeeting {
  _id?: string;
  userId: string;
  title: string;
  date: Date;
  endDate?: Date;
  duration?: number;
  participants: string[];
  transcript?: string;
  summary?: string;
  actionItems?: string[];
}

describe("Dashboard Stats API", () => {
  beforeEach(async () => {
    await Meeting.deleteMany({ userId: "user5" });
    await Task.deleteMany({ userId: "user5" });
    // Could not get useFakeTimers to work, so mocking the now function for now
    // It isn't ideal because we have to use Date.now() in the dashboard controller for this test to pass
    Date.now = jest.fn(() => new Date("2024-04-20").getTime());

    const meetings: TestMeeting[] = [
      // Past meeting
      {
        userId: "user5",
        title: "Meeting 1",
        date: new Date("2024-04-10T09:00:00Z"),
        endDate: new Date("2024-04-10T10:00:00Z"),
        duration: 60,
        participants: ["Alice", "Bob"],
        transcript: "Transcript 1",
        summary: "Summary 1",
        actionItems: ["Action 1"],
      },
      // Past meeting
      {
        userId: "user5",
        title: "Meeting 2",
        date: new Date("2024-04-15T14:00:00Z"),
        endDate: new Date("2024-04-15T14:30:00Z"),
        duration: 30,
        participants: ["Alice", "Charlie"],
        transcript: "Transcript 2",
        summary: "Summary 2",
        actionItems: ["Action 2"],
      },
      // Future meeting
      {
        userId: "user5",
        title: "Meeting 3",
        date: new Date("2024-04-25T11:00:00Z"),
        participants: ["Bob", "Charlie"],
      },
    ];

    await Meeting.insertMany(meetings);

    // Get IDs of created meetings
    const allMeetings = await Meeting.find({ userId: "user5" });
    meetings.forEach((meeting, index) => {
      if (allMeetings[index].title === meeting.title) {
        meetings[index]._id = allMeetings[index]._id as string;
      }
    });

    // Create sample tasks
    const tasks = [
      {
        userId: "user5",
        title: "Task 1",
        dueDate: new Date("2024-04-29T17:00:00Z"), // Not overdue
        status: "pending",
        meetingId: meetings[0]._id,
      },
      {
        userId: "user5",
        title: "Task 2",
        dueDate: new Date("2024-04-12T17:00:00Z"), // Overdue
        status: "in-progress",
        meetingId: meetings[0]._id,
      },
      {
        userId: "user5",
        title: "Task 3",
        dueDate: new Date("2024-04-22T17:00:00Z"), // Not overdue
        status: "in-progress",
        meetingId: meetings[1]._id,
      },
      {
        userId: "user5",
        title: "Task 4",
        dueDate: new Date("2024-04-23T17:00:00Z"), // Not overdue
        status: "completed",
        meetingId: meetings[1]._id,
      },
    ];

    await Task.insertMany(tasks);
  });

  afterEach(async () => {
    await Meeting.deleteMany({ userId: "user5" });
    await Task.deleteMany({ userId: "user5" });
  });

  test("GET /api/dashboard - should retrieve correct dashboard statistics", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty("totalMeetings", 3);
    expect(response.body).toHaveProperty("taskSummary");
    expect(response.body.taskSummary).toEqual({
      pending: 1,
      "in-progress": 2,
      completed: 1,
    });

    expect(response.body).toHaveProperty("upcomingMeetings");
    expect(Array.isArray(response.body.upcomingMeetings)).toBe(true);
    expect(response.body.upcomingMeetings.length).toBe(1);
    expect(response.body.upcomingMeetings[0]).toHaveProperty(
      "title",
      "Meeting 3"
    );

    expect(response.body).toHaveProperty("overdueTasks");
    expect(Array.isArray(response.body.overdueTasks)).toBe(true);
    expect(response.body.overdueTasks.length).toBe(1);
    expect(response.body.overdueTasks[0]).toHaveProperty("title", "Task 2");
    expect(response.body.overdueTasks[0]).toHaveProperty(
      "meetingTitle",
      "Meeting 1"
    );
  });

  test("GET /api/dashboard - should handle users with no meetings and tasks", async () => {
    await Meeting.deleteMany({ userId: "user5" });
    await Task.deleteMany({ userId: "user5" });

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty("totalMeetings", 0);
    expect(response.body).toHaveProperty("taskSummary");
    expect(response.body.taskSummary).toEqual({
      pending: 0,
      "in-progress": 0,
      completed: 0,
    });

    expect(response.body).toHaveProperty("upcomingMeetings");
    expect(Array.isArray(response.body.upcomingMeetings)).toBe(true);
    expect(response.body.upcomingMeetings.length).toBe(0);

    expect(response.body).toHaveProperty("overdueTasks");
    expect(Array.isArray(response.body.overdueTasks)).toBe(true);
    expect(response.body.overdueTasks.length).toBe(0);
  });

  test("GET /api/dashboard - should handle server errors gracefully", async () => {
    jest
      .spyOn(Meeting, "countDocuments")
      .mockRejectedValue(new Error("DB Error"));

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(500);

    expect(response.body).toEqual({ message: "Internal Server Error" });
  });
});
