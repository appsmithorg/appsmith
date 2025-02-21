import { lazy } from "react";
import { retryPromise } from "utils/AppsmithUtils";

export const FirstTimeUserOnboardingChecklist = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "FirstTimeUserOnboardingChecklist" */ "./Checklist"
      ),
  ),
);
