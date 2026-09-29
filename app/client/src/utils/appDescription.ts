// Keep in sync with DESCRIPTION_MAX_LENGTH in the server ApplicationCE.
export const APP_DESCRIPTION_MAX_LENGTH = 250;

export function isAppDescriptionInputValid(value: string) {
  return value.trim().length <= APP_DESCRIPTION_MAX_LENGTH;
}
