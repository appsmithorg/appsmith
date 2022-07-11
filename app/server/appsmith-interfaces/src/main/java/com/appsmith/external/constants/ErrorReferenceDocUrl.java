package com.appsmith.external.constants;

import lombok.Getter;

public enum ErrorReferenceDocUrl {

    GIT_MERGE_CONFLICT("https://docs.appsmith.com/core-concepts/version-control-with-git/merging-branches"),
    GIT_PULL_CONFLICT("https://docs.appsmith.com/core-concepts/version-control-with-git/pull-and-sync"),
    GIT_DEPLOY_KEY("https://docs.appsmith.com/core-concepts/version-control-with-git/connecting-to-git-repository#generating-a-deploy-key"),
    FILE_PATH_NOT_SET("https://docs.appsmith.com/core-concepts/version-control-with-git/updating-local-file-path"),
    GIT_UPSTREAM_CHANGES("https://docs.appsmith.com/core-concepts/version-control-with-git/working-with-branches#syncing-local-with-remote-branch"),
    DEPLOY_KEY_DOC_URL("https://docs.github.com/en/developers/overview/managing-deploy-keys");

    private final String docUrl;

    ErrorReferenceDocUrl(String docUrl) {
        this.docUrl = docUrl;
    }

    public String getDocUrl() { return this.docUrl;}
}
