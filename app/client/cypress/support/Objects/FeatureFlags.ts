export const featureFlagIntercept = (
  flags: Record<string, boolean>,
  reload = true,
) => {
  const response = {
    responseMeta: {
      status: 200,
      success: true,
    },
    data: flags,
    errorDisplay: "",
  };
  cy.intercept("GET", "/api/v1/users/features", response);
  if (reload) {
    cy.reload();
  }
};
