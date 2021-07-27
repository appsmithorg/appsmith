package com.appsmith.server.services;

import com.appsmith.server.domains.GitData;
import org.eclipse.jgit.api.errors.GitAPIException;

import java.io.IOException;

public interface GitDataService extends CrudService<GitData, String> {
    String initializeGit(String path) throws IOException, GitAPIException;

    String cloneRepo(String Url) throws GitAPIException;

}
