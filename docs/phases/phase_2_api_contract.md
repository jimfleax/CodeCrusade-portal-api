# Phase 2 API Contract: Authentication & Authorization

## POST /api/auth/login
- Auth required: No
- Request body: { email: string (required), password: string (required) }
- Success: 200 { success: true, data: { user: { _id: string, name: string, email: string, role: string }, token: string } }
- Errors: 400 (validation), 401 (invalid credentials / inactive user), 500 (server error, shape: { success: false, error: { code: string, message: string } })

## POST /api/auth/logout
- Auth required: Yes (JWT)
- Request body: None
- Success: 200 { success: true, message: "Logged out successfully" }
- Errors: 500 (server error)

## GET /api/auth/me
- Auth required: Yes (JWT)
- Request body: None
- Success: 200 { success: true, data: { user: { _id: string, name: string, email: string, role: string } } }
- Errors: 401 (unauthorized), 500 (server error)
