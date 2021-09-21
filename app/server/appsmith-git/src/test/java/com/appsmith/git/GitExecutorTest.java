package com.appsmith.git;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.GitExecutorImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.junit.Assert;
import org.eclipse.jgit.junit.RepositoryTestCase;
import org.eclipse.jgit.junit.TestRepository;
import org.eclipse.jgit.lib.Repository;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;

import java.io.IOException;
import java.nio.file.Paths;

@Slf4j
@Import({GitExecutorImpl.class})
@RequiredArgsConstructor
public class GitExecutorTest {
    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    private Git git;

    private final GitExecutor gitExecutor;

    private final GitServiceConfig gitServiceConfig;

    private final String gitRemoteUrl = "git@github.com:appsmithorg/appsmith-docs.git";

    @Before
    public void setUp() throws Exception {
        git = Git.init().setDirectory(tempFolder.getRoot() ).call();
        git.add().addFilepattern("Test.txt").call();
        git.commit().setMessage("Initial commit").call();
        git.tag().setName("tag-initial").setMessage("Tag initial").call();
    }

    @After
    public void tearDown() {
        git.getRepository().close();
    }

    @Test
    public void cloneApplication_validRemoteUrlNonEmptyRepo_ThrowError() throws GitAPIException, IOException {
        try {
            gitExecutor.cloneApplication(
                    Paths.get(gitServiceConfig.getGitRootPath()+"orgId"+"appId"+"repoName"),
                    gitRemoteUrl,
                    "PVT_KEY",
                    "PUBLIC_KEY");
        } catch (Exception e) {
            assert e.getMessage().contains("The remote repo is not empty.");
        }
    }

    @Test
    public void cloneApplication_validEmptyRepo_Success() throws GitAPIException, IOException {

    }

    @Test
    public void connectApplication_validEmptyRepo_Success() throws GitAPIException, IOException {

    }

    @Test
    public void connectApplication_validNonEmptyRepo_Success() throws GitAPIException, IOException {
        try {
            gitExecutor.connectApplication(
                    Paths.get(gitServiceConfig.getGitRootPath()+"orgId"+"appId"+"repoName"),
                    gitRemoteUrl,
                    "PVT_KEY",
                    "PUBLIC_KEY");
        } catch (Exception e) {
            assert e.getMessage().contains("The remote repo is not empty.");
        }
    }
}
