import axios from "axios";
import { DEFAULT_AXIOS_CONFIG } from "ee/constants/ApiConstants";
import { apiRequestInterceptor } from "api/interceptors/request/apiRequestInterceptor";
import { apiSuccessResponseInterceptor } from "api/interceptors/response/apiSuccessResponseInterceptor";
import { apiFailureResponseInterceptor } from "api/interceptors/response/apiFailureResponseInterceptor";

export function apiFactory() {
  const axiosInstance = axios.create(DEFAULT_AXIOS_CONFIG);

  axiosInstance.interceptors.request.use(apiRequestInterceptor);
  axiosInstance.interceptors.response.use(
    apiSuccessResponseInterceptor,
    apiFailureResponseInterceptor,
  );

  return axiosInstance;
}
