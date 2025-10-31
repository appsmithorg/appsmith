import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/types";

export type UpdateGeneratedSSHKeyResponseData = GitArtifact;

export type UpdateGeneratedSSHKeyResponse =
  ApiResponse<UpdateGeneratedSSHKeyResponseData>;
