package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import reactor.core.publisher.Mono;

public interface GitService extends CrudService<UserData, String> {

    Mono<UserData> saveGitConfigData(GitConfig gitConfig);

    Mono<GitConfig> getGitConfigForUser();
}
