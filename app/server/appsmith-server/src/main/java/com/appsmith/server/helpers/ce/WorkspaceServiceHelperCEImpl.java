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
}
