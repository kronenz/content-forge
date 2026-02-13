export const createLogger = (context: Record<string, unknown> = {}) => ({
  info: (action: string, data?: Record<string, unknown>) => console.log(JSON.stringify({ level: 'info', action, ...context, ...data })),
  warn: (action: string, data?: Record<string, unknown>) => console.log(JSON.stringify({ level: 'warn', action, ...context, ...data })),
  error: (action: string, data?: Record<string, unknown>) => console.log(JSON.stringify({ level: 'error', action, ...context, ...data }))
});
