package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

public interface WorkspaceServiceHelperCE {
    Mono<Boolean> isCreateWorkspaceAllowed(Boolean isDefaultWorkspace);

    Mono<String> generateDefaultWorkspaceName(String firstName);
}
