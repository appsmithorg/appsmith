package com.appsmith.external.models;

public interface Forkable {
    Datasource fork(Boolean forkWithConfiguration, String toWorkspaceId);
}
