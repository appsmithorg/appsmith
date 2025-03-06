/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AxiosPromise } from "axios";
import type { GitArtifactType } from "git/constants/enums";
import type { PretagResponse } from "./pretagRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

export default async function pretagRequest(
  artifactType: GitArtifactType,
  branchedArtifactId: string,
): AxiosPromise<PretagResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${artifactType}/${branchedArtifactId}/pretag`,
  );
}
