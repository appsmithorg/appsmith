// Provide a valid token openapi token
const token = null;

const extractResponse = (str: string) => {
  if (!str) return;
  const [first, ...allComponents] = str.split("\n\n");

  return allComponents.join("\n\n");
};
export const queryChatGpt = async (query: string) => {
  try {
    const resp = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        model: "code-davinci-002",
        prompt: query,
        temperature: 0,
        max_tokens: 60,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
      }),
    });
    const { choices } = (await resp.json()) || {};

    const responseText = choices?.[0]?.text;

    return responseText;
  } catch (e) {
    console.log("surya ", e);
  }
};
export {};
