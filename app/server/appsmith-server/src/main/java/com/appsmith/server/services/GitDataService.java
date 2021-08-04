package com.appsmith.server.services;

import com.appsmith.server.domains.GitData;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import reactor.core.publisher.Mono;

import java.io.IOException;

public interface GitDataService extends CrudService<GitData, String> {

    Mono<User> saveGitConfigData(GitGlobalConfigDTO gitConfig);

}
