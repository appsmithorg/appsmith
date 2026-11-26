// Keep in sync with DESCRIPTION_MAX_LENGTH in the server ApplicationCE.
export const APP_DESCRIPTION_MAX_LENGTH = 250;

export function isAppDescriptionInputValid(value: string) {
  return value.trim().length <= APP_DESCRIPTION_MAX_LENGTH;
}

// Descriptions are a single paragraph everywhere they show, so runs of
// whitespace (including line breaks typed in a textarea) collapse to a space.
export function normalizeAppDescription(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
