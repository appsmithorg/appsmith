package com.appsmith.server.services;

import com.appsmith.server.domains.GitData;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.Repository;
import reactor.core.publisher.Mono;

import java.io.IOException;

public interface GitDataService extends CrudService<GitData, String> {

    Mono<UserData> saveGitConfigData(GitGlobalConfigDTO gitConfig);

    Mono<UserData> updateGitConfigData(GitGlobalConfigDTO gitConfig);

    String connectToGitRepo(GitGlobalConfigDTO gitGlobalConfigDTO) throws IOException;

}
