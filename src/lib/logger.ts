import "server-only";
type LogLevel="info"|"warn"|"error";
const sensitive=/token|secret|password|credential|authorization|api.?key|private.?key/i;
function sanitize(value:unknown):unknown{if(Array.isArray(value))return value.map(sanitize);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[key,sensitive.test(key)?"[REDACTED]":sanitize(item)]));if(typeof value==="string"&&/(?:sk-|gh[opsu]_)[A-Za-z0-9_-]{12,}/.test(value))return"[REDACTED]";return value;}
export function seedLog(level:LogLevel,event:string,context:Record<string,unknown>={}){const record=JSON.stringify({timestamp:new Date().toISOString(),level,event,...sanitize(context)as Record<string,unknown>});if(level==="error")console.error(record);else if(level==="warn")console.warn(record);else console.info(record);}
