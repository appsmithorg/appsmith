/* eslint-disable no-console */

export const validateWindowMessageListenerOrigin = (
  origin: string,
  listenersMap: Map<string, unknown>,
) => {
  const urlError = checkUrlError(origin);
  if (urlError) {
    console.error({
      text: urlError,
      state: {
        domain: origin,
      },
    });
    return false;
  }

  const existingListener = listenersMap.get(origin);
  if (existingListener) {
    console.warn({
      text: `Already listening to ${origin}.`,
    });
    return false;
  }
  return true;
};

export const validateUnlistenWindowMessageOrigin = (
  origin: string,
  listenersMap: Map<string, unknown>,
) => {
  const urlError = checkUrlError(origin);
  if (urlError) {
    console.error({
      text: urlError,
      state: {
        domain: origin,
      },
    });
    return false;
  }
  const existingListener = listenersMap.get(origin);
  if (!existingListener) {
    console.warn({
      text: `No subcriptions to ${origin}.`,
    });
    return false;
  }
  return true;
};

export const checkUrlError = (urlString: string) => {
  try {
    const url = new URL(urlString);

    if (url.search.length > 0) {
      return `Please use a valid domain name. e.g. https://domain.com (No query params)`;
    }

    if (url.pathname !== "/") {
      return `Please use a valid domain name. e.g. https://domain.com (No sub-directories)`;
    }

    if (urlString[urlString.length - 1] === "/") {
      return `Please use a valid domain name. e.g. https://domain.com (No trailing slash)`;
    }
  } catch (_) {
    return `Please use a valid domain name. e.g. https://domain.com`;
  }
};
