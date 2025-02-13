import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";

export default function packageStatusTransformer(
  // need this for preserving interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  status: FetchStatusResponseData,
) {
  return null;
}
