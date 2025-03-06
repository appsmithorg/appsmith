package com.appsmith.server.git;


import com.appsmith.server.domains.Application;
import com.appsmith.server.git.ce.GitTestUtilsCE;
import org.springframework.stereotype.Component;

@Component
public class GitTestUtils extends GitTestUtilsCE {
    public GitTestUtils(GitArtifactTestUtils<Application> gitApplicationTestUtils) {
        super(gitApplicationTestUtils);
    }
}
