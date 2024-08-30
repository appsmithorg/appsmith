import type { AxiosResponse } from "axios";

export const addExecutionMetaProperties = (response: AxiosResponse) => {
  const clientMeta = {
    size: response.headers["content-length"],
    duration: Number(
      performance.now() - response.config.headers.timer,
    ).toFixed(),
  };

  return { ...response.data, clientMeta };
};
