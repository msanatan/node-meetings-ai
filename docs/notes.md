# Notes

## Critical bug

We're asking the user for their ID in the header, and not the actual JWT...

```typescript
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  req.userId = userId;
  next();
};
```

Also, this endpoint returned all meetings, irrespective of the user's participation

```typescript
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const meetings = await Meeting.find();
    res.json({
      total: meetings.length,
      limit: req.query.limit,
      page: req.query.page,
      data: meetings,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});
```

## Project structure

The project previously had models and views, with the view being called a router. In general I'll follow the MVC pattern, which means separating some logic from the router to the controller.

Also, each API will be separated. Why? As the project grows in size, it usually easier to debug issues when all the logic for a problematic feature is one place. As the project gets more traffic and scales, we may find it useful or necessary to deploy an API separately. If all of the API's logic is in one place, the migration is easier. At the very least, I've standardized the naming conventions.

Why have a separate app.ts and server.ts file? Single responsibility principle - let's have Node.js modules do one thing and one thing well as much as possible. Sticking to that principle theoretically make things easier to test.

## Limitations

1. Stats and dashboard. I'm relatively new to Mongo, so with limited time I haven't been able to get into the aggregation abilities fully
1. The AI mocking is subpar. Ideally it'll be an external service, with a delay so we don't immediately get tasks coming out from it
1. Would have liked to refactor some more by creating repositories, and maybe adding Redis. Caching helps with scalablity and as the app grows these level of abstractions come in handy
