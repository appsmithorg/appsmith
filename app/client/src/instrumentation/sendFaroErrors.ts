import { v4 as uuidv4 } from "uuid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function captureException(exception: any, hint?: any): string {
  const eventId = uuidv4();
  const context = hint || {};

  try {
    window.faro?.api.pushError(
      exception instanceof Error ? exception : new Error(String(exception)),
      { type: "error", context: context },
    );
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }

  return eventId;
}

export default captureException;
