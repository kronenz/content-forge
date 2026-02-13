---
globs: ["**/*.ts", "**/*.js", "**/*.vue"]
---
# Security Rules
- Never hardcode secrets, API keys, or tokens in source code
- All secrets must come from environment variables (.env)
- Never commit .env files (only .env.example with placeholder values)
- Sanitize all external input before processing
- Use parameterized queries for any database operations (no string concatenation)
- Validate URL inputs before fetch calls
- No eval(), new Function(), or dynamic code execution
- Log errors without exposing sensitive data (mask API keys in logs)
