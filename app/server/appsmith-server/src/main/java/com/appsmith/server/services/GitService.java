package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.services.ce_compatible.GitServiceCECompatible;
import reactor.core.publisher.Mono;

import java.util.List;

public interface GitService extends GitServiceCECompatible {

    Mono<String> setDefaultBranch(String defaultApplicationId, String newDefaultBranchName);

    Mono<Application> protectBranch(String defaultApplicationId, String branchName);

    Mono<Application> unProtectBranch(String defaultApplicationId, String branchName);

    Mono<List<String>> getProtectedBranches(String defaultApplicationId);
}
