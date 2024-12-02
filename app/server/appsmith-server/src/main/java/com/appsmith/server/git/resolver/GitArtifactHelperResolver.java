package com.appsmith.server.git.resolver;

import com.appsmith.server.domains.Application;
import com.appsmith.server.git.fs.GitFSServiceImpl;
import com.appsmith.server.services.GitArtifactHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class GitArtifactHelperResolver extends GitArtifactHelperResolverCE {

    public GitArtifactHelperResolver(
            @Lazy GitFSServiceImpl gitFSService, GitArtifactHelper<Application> gitApplicationHelper) {
        super(gitFSService, gitApplicationHelper);
    }
}
