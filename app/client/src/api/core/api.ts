import type { AxiosResponseData } from "api/types";

import { apiFactory } from "./factory";

const apiInstance = apiFactory();

export async function get<T>(...args: Parameters<typeof apiInstance.get>) {
  return apiInstance.get<T, AxiosResponseData<T>>(...args);
}

export async function post<T>(...args: Parameters<typeof apiInstance.post>) {
  return apiInstance.post<T, AxiosResponseData<T>>(...args);
}

export async function put<T>(...args: Parameters<typeof apiInstance.put>) {
  return apiInstance.put<T, AxiosResponseData<T>>(...args);
}

// Note: _delete is used instead of delete because delete is a reserved keyword in JavaScript
async function _delete<T>(...args: Parameters<typeof apiInstance.delete>) {
  return apiInstance.delete<T, AxiosResponseData<T>>(...args);
}

export { _delete as delete };

export async function patch<T>(...args: Parameters<typeof apiInstance.patch>) {
  return apiInstance.patch<T, AxiosResponseData<T>>(...args);
}
