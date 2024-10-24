const generateJWT = () => {
  return "JWT token";
};

export async function datasourceRequest(...args: any) {
  console.log("Hello");
  const [requestType, apiPath, options = {}] = args;
  try {
    const PROJECT_ID = "PROJECT_ID";
    const data = await fetch(
      `https://proxy.useparagon.com/projects/${PROJECT_ID}/sdk/proxy/${requestType}/${apiPath}`,
      {
        method: options.method || "GET",
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: {
          Authorization: `Bearer ${generateJWT()}`,
          "Content-Type": "application/json",
        },
      },
    ).then((res) => res.json());
    console.log(data);
    return data;
  } catch (e) {
    console.trace(e);
    throw e;
  }
}
