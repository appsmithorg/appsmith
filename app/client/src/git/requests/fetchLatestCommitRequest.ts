/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AxiosPromise } from "axios";
import type { GitArtifactType } from "git/constants/enums";
import type { FetchLatestCommitResponse } from "./fetchLatestCommitRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

export default async function fetchLatestCommitRequest(
  artifactType: GitArtifactType,
  branchedArtifactId: string,
): AxiosPromise<FetchLatestCommitResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${artifactType}/${branchedArtifactId}/commit/latest`,
  );
}
