// Env-gate parsing shared by the MCP entrypoint. The Admin Settings UI writes "true"/"false"; operators may also
// use "1"/"0". These are opt-IN gates (data layer, restricted JS): enabled only for an explicit truthy value, so a
// missing or unrecognized value stays off. The master APPSMITH_MCP_ENABLED gate is default-ON and handled separately
// (deny-list) in the deploy scripts and the server-side SecurityConfig.
export function gateEnabled(value: string | undefined): boolean {
  return value !== undefined && /^(1|true|yes|on)$/i.test(value.trim());
}
