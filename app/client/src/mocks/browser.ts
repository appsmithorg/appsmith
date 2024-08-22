import { setupWorker } from "msw";
import { handlers } from "ee/mocks/handlers";

export const worker = setupWorker(...handlers);
