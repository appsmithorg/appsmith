package com.appsmith.server.git;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.GitExecutorImpl;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.FileSystemUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Import({GitExecutorImpl.class})
@RunWith(SpringRunner.class)
@SpringBootTest
public class GitExecutorTest {

    @Autowired
    private GitExecutor gitExecutor;

    @Autowired
    private GitServiceConfig gitServiceConfig;

    private Git git;

    private Path path;

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    @Before
    public void setUp() throws GitAPIException {
        path = Paths.get(gitServiceConfig.getGitRootPath(), "orgId", "applicationId", "repoName");

        git = Git.init().setDirectory(Paths.get( gitServiceConfig.getGitRootPath(), "orgId", "applicationId", "repoName").toFile()).call();
    }

    @After
    public void tearDown() {
        git.getRepository().close();
        File file = Paths.get( gitServiceConfig.getGitRootPath(), "orgId").toFile();
        while (file.exists()) {
            FileSystemUtils.deleteRecursively(file);
        }
    }

    // TODO cover the below mentioned test cases
    /*
    * Clone with invalid keys
    * Clone with invalid remote
    * Clone with valid data
    * */
}
