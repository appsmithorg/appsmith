package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.ApplicationGitReference;
import com.google.gson.Gson;

import java.nio.file.Path;

public class GitFileSystemParser {
    private ApplicationGitReference applicationGitReference;
    private Gson gson;
    private Path baseRepoPath;

    public GitFileSystemParser(Gson gson, Path baseRepoPath) {
        this.applicationGitReference = new ApplicationGitReference();
        this.gson = gson;
        this.baseRepoPath = baseRepoPath;
    }

    public void readActions() {}

    public void readDatasources() {}

    public void readPages() {}

    public void readActionCollections() {}

    public void readAll() {}
}
