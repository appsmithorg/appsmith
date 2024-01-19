package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.ce.AutoDeployment;
import com.appsmith.server.dtos.GitDeployApplicationResultDTO;
import com.appsmith.server.services.ce.GitServiceCE;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface GitServiceCECompatible extends GitServiceCE {
    Mono<String> setDefaultBranch(String defaultApplicationId, String newDefaultBranchName);

    Mono<String> generateBearerTokenForApplication(String defaultApplicationId);

    Mono<GitDeployApplicationResultDTO> autoDeployGitApplication(String defaultApplicationId, String branchName);

    Mono<Set<AutoDeployment>> configureAutoDeployment(String defaultApplicationId, String branchName, boolean enabled);
}
