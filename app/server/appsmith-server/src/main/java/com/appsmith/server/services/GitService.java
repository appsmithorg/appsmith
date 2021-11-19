package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchListDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitBranchDTO;
import com.appsmith.server.dtos.GitCheckoutBranchDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface GitService {

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile);

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile, Boolean isDefault, String defaultApplicationId);

    Mono<GitProfile> getGitProfileForUser();

    Mono<GitProfile> getGitProfileForUser(String defaultApplicationId);

    Mono<Application> connectApplicationToGit(String defaultApplicationId, GitConnectDTO gitConnectDTO, String origin);

    Mono<Application> updateGitMetadata(String applicationId, GitApplicationMetadata gitApplicationMetadata);

    Mono<String> commitApplication(GitCommitDTO commitDTO, String defaultApplicationId, MultiValueMap<String, String> params);

    Mono<List<GitLogDTO>> getCommitHistory(String defaultApplicationId, MultiValueMap<String, String> params);

    Mono<String> pushApplication(String defaultApplicationId, MultiValueMap<String, String> params);

    Mono<Application> detachRemote(String applicationId);

    Mono<Application> createBranch(String defaultApplicationId, GitBranchDTO branchDTO, MultiValueMap<String, String> params);

    Mono<Application> checkoutBranch(String defaultApplicationId, String branchName, GitCheckoutBranchDTO gitCheckoutBranchDTO);

    Mono<GitPullDTO> pullApplication(String defaultApplicationId, String branchName);

    Mono<List<GitBranchListDTO>> listBranchForApplication(String defaultApplicationId);

    Mono<GitApplicationMetadata> getGitApplicationMetadata(String defaultApplicationId);

    Mono<Map<String, Object>> getStatus(String defaultApplicationId, MultiValueMap<String, String> params);

    Mono<GitPullDTO> mergeBranch(String applicationId, GitMergeDTO gitMergeDTO);

    Mono<MergeStatusDTO> isBranchMergeable(String applicationId, GitMergeDTO gitMergeDTO);
}
