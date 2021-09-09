package com.appsmith.external.git;

import java.nio.file.Path;

public interface GitExecutor {

    boolean cloneApp(String repoPath, String remoteUrl, String privateSshKey, String publicSshKey);
}
