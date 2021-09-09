package com.appsmith.external.git;

import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;

public interface GitExecutor {

    String cloneApp(String repoPath, String repoName,  String remoteUrl, String privateSshKey, String publicSshKey) throws GitAPIException;
}
