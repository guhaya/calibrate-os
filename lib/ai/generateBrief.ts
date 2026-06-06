// All Anthropic API calls route through this module — never call the SDK directly elsewhere.
// Requires: ANTHROPIC_API_KEY environment variable (server-only, never expose to client).
// Model: claude-sonnet-4-6 per docs/CLAUDE.md.
// The brief is generated once per user per day; always check ai_daily_briefs table first.
export {};
