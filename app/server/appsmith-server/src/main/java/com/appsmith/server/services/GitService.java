package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitConnectDTO;
import reactor.core.publisher.Mono;

public interface GitService extends CrudService<UserData, String> {

    Mono<UserData> saveGitConfigData(GitConfig gitConfig);

    Mono<GitConfig> getGitConfigForUser();

    Mono<Application> connectApplicationToGit(GitConnectDTO gitConnectDTO);
}
