export const featureFlagIntercept = (
  flags: Record<string, boolean> = {},
  reload = true,
) => {
  const response = {
    responseMeta: {
      status: 200,
      success: true,
    },
    data: {
      ...flags,
      release_app_sidebar_enabled: true,
    },
    errorDisplay: "",
  };
  cy.intercept("GET", "/api/v1/users/features", response);
  if (reload) {
    cy.reload();
    cy.wait(2000); //for the page to re-load finish for CI runs
  }
};
