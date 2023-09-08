export const getApplicationKBApi = async (applicationId: string) => {
  try {
    const response = await fetch(`/api/v1/kb/${applicationId}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const parsedResponse = await response.json();

    return parsedResponse.data;
  } catch (e) {}
};

export const generateApplicationKBApi = async (applicationId: string) => {
  try {
    const response = await fetch(`/api/v1/kb/${applicationId}`, {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const parsedResponse = await response.json();

    return parsedResponse.data;
  } catch (e) {}
};
