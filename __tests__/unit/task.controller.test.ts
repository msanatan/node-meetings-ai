import request from "supertest";
import app from "../../src/app.js";
import { Task } from "../../src/services/tasks/task.model.js";
import { generateToken } from "../../src/utils/token.js";

// Mock Mongoose Model
jest.mock("../../src/services/tasks/task.model.js");
let authToken = "";
beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  authToken = generateToken("mockUserId", process.env.JWT_SECRET);
});

describe("GET /api/tasks", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("you get a list of tasks with default pagination if no query params are provided", async () => {
    const mockTasks = [
      { title: "Sample Task 1", userId: "mockUserId" },
      { title: "Sample Task 2", userId: "mockUserId" },
    ];
    (Task.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTasks),
      }),
    });
    (Task.countDocuments as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toEqual({
      total: 2,
      limit: 10,
      page: 1,
      data: mockTasks,
    });
    expect(Task.find).toHaveBeenCalledWith({ userId: "mockUserId" });
  });

  test("you get a list of tasks with specified pagination", async () => {
    const mockTasks = [{ title: "Sample Task 3" }];
    (Task.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTasks),
      }),
    });
    (Task.countDocuments as jest.Mock).mockResolvedValue(5);

    const res = await request(app)
      .get("/api/tasks?limit=1&page=3")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toEqual({
      total: 5,
      limit: 1,
      page: 3,
      data: mockTasks,
    });
    expect(Task.find).toHaveBeenCalledWith({ userId: "mockUserId" });
    expect(Task.find().limit).toHaveBeenCalledWith(1);
    expect(Task.find().skip).toHaveBeenCalledWith(2); // Skip 2 items for page 3 with limit 1
  });

  test("you get a server errors for DB errors", async () => {
    (Task.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error("Database error")),
      }),
    });

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(500);

    expect(res.body).toEqual({
      message: "Database error",
    });
  });
});
