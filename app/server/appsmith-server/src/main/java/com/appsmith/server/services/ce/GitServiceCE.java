package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitImportDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface GitServiceCE {

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile);

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile, String defaultApplicationId);

    Mono<GitProfile> getDefaultGitProfileOrCreateIfEmpty();

    Mono<GitProfile> getGitProfileForUser(String defaultApplicationId);

    Mono<Application> connectApplicationToGit(String defaultApplicationId, GitConnectDTO gitConnectDTO, String origin);

    Mono<Application> updateGitMetadata(String applicationId, GitApplicationMetadata gitApplicationMetadata);

    Mono<String> commitApplication(GitCommitDTO commitDTO, String defaultApplicationId, String branchName);

    Mono<List<GitLogDTO>> getCommitHistory(String defaultApplicationId, String branchName);

    Mono<String> pushApplication(String defaultApplicationId, String branchName);

    Mono<Application> detachRemote(String defaultApplicationId);

    Mono<Application> createBranch(String defaultApplicationId, GitBranchDTO branchDTO, String srcBranch);

    Mono<Application> checkoutBranch(String defaultApplicationId, String branchName);

    Mono<GitPullDTO> pullApplication(String defaultApplicationId, String branchName);

    Mono<List<GitBranchDTO>> listBranchForApplication(String defaultApplicationId, Boolean pruneBranches, String currentBranch);

    Mono<GitApplicationMetadata> getGitApplicationMetadata(String defaultApplicationId);

    Mono<GitStatusDTO> getStatus(String defaultApplicationId, String branchName);

    Mono<MergeStatusDTO> mergeBranch(String applicationId, GitMergeDTO gitMergeDTO);

    Mono<MergeStatusDTO> isBranchMergeable(String applicationId, GitMergeDTO gitMergeDTO);

    Mono<String> createConflictedBranch(String defaultApplicationId, String branchName);

    Mono<GitImportDTO> importApplicationFromGit(String organisationId, GitConnectDTO gitConnectDTO);

    Mono<GitAuth> generateSSHKey();

    Mono<Boolean> testConnection(String defaultApplicationId);

}
