package com.appsmith.server.helpers.ce;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static java.lang.Boolean.TRUE;

@Component
@AllArgsConstructor
public class WorkspaceServiceHelperCEImpl implements WorkspaceServiceHelperCE {

    @Override
    public Mono<Boolean> isCreateWorkspaceAllowed(Boolean isDefaultWorkspace) {
        return Mono.just(TRUE);
    }

    @Override
    public Mono<String> generateDefaultWorkspaceName(String firstName) {
        // Default implementation returns "x's apps"
        return Mono.just(firstName + "'s apps");
    }
}
