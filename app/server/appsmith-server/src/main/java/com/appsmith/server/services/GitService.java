package com.appsmith.server.services;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import reactor.core.publisher.Mono;

public interface GitService extends CrudService<UserData, String> {

    Mono<UserData> saveGitConfigData(GitGlobalConfigDTO gitConfig);

    Mono<UserData> updateGitConfigData(GitGlobalConfigDTO gitConfig);
}
