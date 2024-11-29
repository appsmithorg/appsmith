package com.appsmith.server.git.resolver;

import com.appsmith.server.git.central.GitHandlingService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.git.fs.GitFSServiceImpl;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class GitHandlingServiceResolverCE {

    protected final GitFSServiceImpl gitFSService;

    public GitHandlingService getGitHandlingService(@NonNull GitType gitType) {
        return switch (gitType) {
            case FILE_SYSTEM -> gitFSService;
            default -> gitFSService;
        };
    }
}
