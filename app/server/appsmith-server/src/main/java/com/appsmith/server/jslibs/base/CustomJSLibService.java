package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomJSLibService extends CustomJSLibServiceCE {
    Mono<Boolean> addHiddenJSLibsToContext(
            @NotNull String contextId,
            CreatorContextType contextType,
            @NotNull Set<CustomJSLib> jsLibs,
            String branchName,
            Boolean isForceInstall);
}
