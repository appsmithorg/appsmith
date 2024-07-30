export function createMessage(
  format: (...strArgs: any[]) => string,
  ...args: any[]
) {
  return format(...args);
}

export const ERROR_MESSAGE_NAME_EMPTY = () => `Please select a name`;

export const FORM_VALIDATION_INVALID_EMAIL = () =>
  `Please provide a valid email address`;

export const INVITE_USERS_VALIDATION_EMAIL_LIST = () =>
  `Invalid email address(es) found`;

export const REMOVE = () => "Remove";

export const DISPLAY_IMAGE_UPLOAD_LABEL = () => "Upload display picture";

export const ADD_REACTION = () => "Add Reaction";

export const EMOJI = () => "Emoji";

// Showcase Carousel
export const NEXT = () => "Next";
export const BACK = () => "Back";
export const SKIP = () => "Skip";

export const LEARN_MORE = () => "Learn more";

export const SNIPPET_TOOLTIP = () => "Search code snippets";

export const ERROR_EMPTY_APPLICATION_NAME = () =>
  `Application name can't be empty`;

export const ERROR_FILE_TOO_LARGE = (fileSize: string) =>
  `File size should be less than ${fileSize}!`;
export const REMOVE_FILE_TOOL_TIP = () => "Remove upload";
