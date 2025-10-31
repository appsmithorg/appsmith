import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

export const GIT_CONNECT_STEPS = {
  CHOOSE_PROVIDER: "choose-provider",
  GENERATE_SSH_KEY: "generate-ssh-key",
  ADD_DEPLOY_KEY: "add-deploy-key",
};

export const GIT_DEMO_GIF = {
  create_repo: {
    github: getAssetUrl(`${ASSETS_CDN_URL}/Github_create_empty_repo.gif`),
    gitlab: getAssetUrl(`${ASSETS_CDN_URL}/Gitlab_create_a_repo.gif`),
    bitbucket: getAssetUrl(`${ASSETS_CDN_URL}/Bitbucket_create_a_repo.gif`),
  },
  copy_remoteurl: {
    github: getAssetUrl(`${ASSETS_CDN_URL}/Github_SSHkey.gif`),
    gitlab: getAssetUrl(`${ASSETS_CDN_URL}/Gitlab_SSHKey.gif`),
    bitbucket: getAssetUrl(`${ASSETS_CDN_URL}/Bitbucket_Copy_SSHKey.gif`),
  },
  add_deploykey: {
    github: getAssetUrl(`${ASSETS_CDN_URL}/Github_add_deploykey.gif`),
    gitlab: getAssetUrl(`${ASSETS_CDN_URL}/Gitlab_add_deploy_key.gif`),
    bitbucket: getAssetUrl(`${ASSETS_CDN_URL}/Bitbucket_add_a_deploykey.gif`),
  },
};

export const GIT_PROVIDERS = [
  "github",
  "gitlab",
  "bitbucket",
  "others",
] as const;
