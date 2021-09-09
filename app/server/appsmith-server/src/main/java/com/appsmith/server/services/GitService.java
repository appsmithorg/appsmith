package com.appsmith.server.services;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface GitService {

    Mono<UserData> saveGitConfigData(GitConfig gitConfig);

    Mono<GitConfig> getGitConfigForUser();

    Mono<Application> connectApplicationToGit(GitConnectDTO gitConnectDTO);

    Mono<String> commitApplication(GitCommitDTO commitDTO, String applicationId);

    Mono<String> commitApplication(String applicationId);

    Mono<List<GitLogDTO>> getCommitHistory(String applicationId);

    Mono<String> pushApplication(String applicationId);
}
