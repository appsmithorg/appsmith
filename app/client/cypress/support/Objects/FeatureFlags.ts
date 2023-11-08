export const featureFlagIntercept = (
  flags: Record<string, boolean>,
  reload = true,
) => {

  cy.intercept(
    {
      method: "GET",
      url: "/api/v1/users/features",
    },
    (req) => {
      req.reply((res) => {
        if (res) {
          const originalResponse = res.body;
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
          res.send({
            responseMeta: {
              status: 200,
              success: true,
            },
            data: { ...modifiedResponse },
            errorDisplay: "",
          });
        }
      });
    },
  ).as("getFeatures");
};
