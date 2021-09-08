package com.appsmith.git.service;

import com.appsmith.external.git.GitExecutor;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.transport.CredentialItem;
import org.eclipse.jgit.transport.CredentialsProvider;

import java.io.File;
import java.io.IOException;

public class GitExecutorImpl implements GitExecutor {

    @Override
    public String CheckConnection(String remoteUrl, String sshKey) throws IOException {
        File localPath = File.createTempFile("TestGitRepository", "");
        if(!localPath.delete()) {
            throw new IOException("Could not delete temporary file " + localPath);
        }

        /*CredentialsProvider credentialsProvider;
        CredentialItem credentialItem = new

        try (Git result = Git.cloneRepository()
                .setURI(remoteUrl)
                .setCredentialsProvider()
                .setDirectory(localPath)
                .call()) {

        }*/

        // clean up here to not keep using more and more disk-space for these samples
        FileUtils.deleteDirectory(localPath);
        return "";
    }
}
