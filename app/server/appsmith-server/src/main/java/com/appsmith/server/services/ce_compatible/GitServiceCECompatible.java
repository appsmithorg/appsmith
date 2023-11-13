package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.services.ce.GitServiceCE;
import reactor.core.publisher.Mono;

public interface GitServiceCECompatible extends GitServiceCE {
    Mono<String> setDefaultBranch(String defaultApplicationId, String newDefaultBranchName);
}
