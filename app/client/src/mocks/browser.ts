import { handlers } from "ee/mocks/handlers";
import { setupWorker } from "msw";

export const worker = setupWorker(...handlers);
