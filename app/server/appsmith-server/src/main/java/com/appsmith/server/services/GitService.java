package com.appsmith.server.services;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitBranchDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface GitService {

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile);

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile, boolean isDefault, String defaultApplicationId);

    Mono<GitProfile> getGitProfileForUser();

    Mono<GitProfile> getGitProfileForUser(String defaultApplicationId);

    Mono<Application> connectApplicationToGit(String defaultApplicationId, GitConnectDTO gitConnectDTO);

    Mono<String> commitApplication(GitCommitDTO commitDTO, String applicationId);

    Mono<String> commitApplication(String applicationId);

    Mono<List<GitLogDTO>> getCommitHistory(String applicationId);

    Mono<String> pushApplication(String applicationId);

    Mono<Application> createBranch(String srcApplicationId, GitBranchDTO branchDTO);

    Mono<String> pullForApplication(String applicationId, String branchName);
}
