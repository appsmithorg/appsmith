import * as Sentry from "@sentry/react";
import { Route } from "react-router";

export const SentryRoute = Sentry.withSentryRouting(Route);
