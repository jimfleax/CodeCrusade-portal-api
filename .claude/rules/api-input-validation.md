---
paths:
  - "src/controllers/**/*.ts"
  - "src/routes/**/*.ts"
  - "src/middleware/**/*.ts"
---

# API Input Validation and Safe Destructuring

Express `req.body` can be `undefined` if a client sends a request without a payload or a `Content-Type` header. Destructuring properties directly from an unvalidated or un-fallback'd `req.body` will cause fatal runtime errors (e.g., `TypeError: Cannot destructure property '...' of 'req.body' as it is undefined`). 

You must always guarantee `req.body` is at least an empty object before destructuring, or use proper schema validation (like Zod) to parse the request body safely.

## Incorrect

Directly destructuring `req.body` without fallback. If the request lacks a body payload, the app crashes.

```typescript
export const markMissingAsAbsent = asyncHandler(async (req: Request, res: Response) => {
  // ❌ BAD: If req.body is undefined, this throws a TypeError and crashes the request
  const { labId } = req.body;
  const result = await attendanceService.markMissingAsAbsent(req.params.dayId, labId);
  res.status(200).json({ success: true, data: result });
});
```

## Correct

Safely falling back to an empty object when destructuring optional fields.

```typescript
export const markMissingAsAbsent = asyncHandler(async (req: Request, res: Response) => {
  // ✅ GOOD: Safely falls back to {} if req.body is undefined
  const { labId } = req.body || {};
  const result = await attendanceService.markMissingAsAbsent(req.params.dayId, labId);
  res.status(200).json({ success: true, data: result });
});
```

## Best Practice (Zod Validation)

If a route requires specific body fields, use a Zod schema to parse the body safely, and return a 400 Bad Request if validation fails.

```typescript
import { z } from 'zod';

const UpdateSchema = z.object({
  labId: z.string().optional()
});

export const updateLab = asyncHandler(async (req: Request, res: Response) => {
  // ✅ BEST: Validates input and safely handles missing or malformed bodies
  const parsed = UpdateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request payload" });
    return;
  }
  
  const { labId } = parsed.data;
  // ...
});
```
