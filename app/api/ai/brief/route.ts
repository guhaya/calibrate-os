// POST /api/ai/brief
// Generates the AI daily brief for the authenticated user.
// Checks ai_daily_briefs for an existing record before calling the Anthropic API.
// Returns the brief (cached or newly generated).
export {};
