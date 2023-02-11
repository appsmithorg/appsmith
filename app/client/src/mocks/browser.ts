import { setupWorker } from "msw";
import { handlers } from "@appsmith/mocks/handlers";

export const worker = setupWorker(...handlers);
