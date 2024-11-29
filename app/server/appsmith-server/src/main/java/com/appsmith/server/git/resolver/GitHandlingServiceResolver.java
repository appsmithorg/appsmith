package com.appsmith.server.git.resolver;

import com.appsmith.server.git.fs.GitFSServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class GitHandlingServiceResolver extends GitHandlingServiceResolverCE {

    public GitHandlingServiceResolver(GitFSServiceImpl gitFSService) {
        super(gitFSService);
    }
}
