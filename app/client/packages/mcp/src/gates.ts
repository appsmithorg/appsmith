// Env-gate parsing shared by the MCP entrypoint. The Admin Settings UI writes "true"/"false"; operators may also
// use "1"/"0".

// Explicit-truthy check: enabled only for a recognized truthy value. Used where a value is always present.
export function gateEnabled(value: string | undefined): boolean {
  return value !== undefined && /^(1|true|yes|on)$/i.test(value.trim());
}

// Default-ON gate: enabled unless explicitly disabled (false/0/no/off). The MCP data layer and restricted JS objects
// are ON by default, matching the master APPSMITH_MCP_ENABLED gate — a missing/unrecognized value stays enabled.
export function gateEnabledByDefault(value: string | undefined): boolean {
  return value === undefined || !/^(false|0|no|off)$/i.test(value.trim());
}
