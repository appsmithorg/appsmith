export const featureFlagIntercept = (
  flags: Record<string, boolean>,
  shouldIntercept = true,
) => {

  if (shouldIntercept) {
    cy.intercept("GET", "/api/v1/users/features").as("getFeatures");
  }

  cy.reload();
  cy.wait(2000);

  if (shouldIntercept) {
    cy.wait("@getFeatures").then((interception) => {
      if (interception && interception.response) {
        const originalResponse = interception?.response.body;
        let modifiedResponse: any = {}
        Object.keys(originalResponse.data).forEach(flag => {
          if (flag.startsWith('license_')) {
            modifiedResponse[flag] = originalResponse.data[flag]
          }
        })
        modifiedResponse = {
          ...modifiedResponse,
          ...flags
        }
        const response = {
          responseMeta: {
            status: 200,
            success: true,
          },
          data: { ...modifiedResponse },
          errorDisplay: "",
        };
        cy.intercept("GET", "/api/v1/users/features", response);
      }
    })
  }
};
