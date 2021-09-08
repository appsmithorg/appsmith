package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import reactor.core.publisher.Mono;

public interface GitService {

    Mono<UserData> saveGitConfigData(GitConfig gitConfig);

    Mono<GitConfig> getGitConfigForUser();

    Mono<String> commitApplication(String commitMessage, String applicationId);

    Mono<String> commitApplication(String applicationId);
}
