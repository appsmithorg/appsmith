package com.appsmith.server.services;

import com.appsmith.server.services.ce_compatible.GitServiceCECompatible;
import reactor.core.publisher.Mono;

public interface GitService extends GitServiceCECompatible {

    Mono<String> setDefaultBranch(String defaultApplicationId, String newDefaultBranchName);
}
