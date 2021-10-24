package com.appsmith.server.git;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.MergeStatus;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.GitExecutorImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@Import({GitExecutorImpl.class})
@RunWith(SpringRunner.class)
@SpringBootTest
public class GitExecutorTest {

    @Autowired
    private GitExecutor gitExecutor;

    @Autowired
    private GitServiceConfig gitServiceConfig;

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    private Git git;

    private Path path;

    @Before
    public void setUp() throws GitAPIException {
        git = Git.init().setDirectory( tempFolder.getRoot() ).call();
        path = git.getRepository().getDirectory().toPath();
    }

    @After
    public void tearDown() {
        git.getRepository().close();
    }

    private void createFileInThePath(String fileName) throws IOException {
        File file = new File(path.toString() + "/" + fileName);
        FileUtils.writeStringToFile(file, "Add test data" + fileName, "UTF-8", false);

    }

    private void commitToRepo() {
        gitExecutor.commitApplication(path, "Test commit", "test", "test@test.com").block();
    }

    @Test
    public void commit_validChange_Success() throws IOException {
        createFileInThePath("TestFIle2");
        String commitStatus = gitExecutor.commitApplication(path, "Test commit", "test", "test@test.com").block();
        Mono<List<GitLogDTO>> commitList = gitExecutor.getCommitHistory(path);

        StepVerifier
                .create(commitList)
                .assertNext(list -> {
                    assertThat(commitStatus).isEqualTo("Committed successfully!");
                    assertThat(list).isNotEmpty();
                    assertThat(list.get(0).getCommitMessage()).isNotEmpty();
                    assertThat(list.get(0).getCommitMessage()).isEqualTo("Test commit");
                    assertThat(list.get(0).getAuthorEmail()).isEqualTo("test@test.com");
                    assertThat(list.get(0).getAuthorName()).isEqualTo("test");

                });

    }

    @Test
    public void createBranch_validRepo_success() throws IOException {
        createFileInThePath("TestFIle3");
        commitToRepo();
        Mono<String> branchStatus = gitExecutor.createAndCheckoutToBranch(path, "branch/f1");

        StepVerifier
                .create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo("branch/f1");
                })
                .verifyComplete();
    }

    @Test
    public void createBranch_duplicateName_ThrowError() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        Mono<String> branchStatus = gitExecutor.createAndCheckoutToBranch(path, "main");

        StepVerifier
                .create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isNotEmpty();
                    assertThat(status).isEqualTo("main");
                })
                .verifyComplete();
    }

    @Test
    public void isMergeBranch_NoChanges_CanBeMerged() throws IOException, GitAPIException {
        createFileInThePath("isMergeBranch_NoChanges_CanBeMerged");
        commitToRepo();

        //create branch f1
        gitExecutor.createAndCheckoutToBranch(path, "f1").block();
        //Create branch f2 from f1
        gitExecutor.createAndCheckoutToBranch(path, "f2").block();

        Mono<MergeStatus> mergeableStatus = gitExecutor.isMergeBranch(path, "f1", "f2");

        StepVerifier
                .create(mergeableStatus)
                .assertNext( s -> {
                    assertThat(s.isMerge());
                })
                .verifyComplete();

    }

    @Test
    public void isMergeBranch_NonConflictingChanges_CanBeMerged() throws IOException, GitAPIException {
        createFileInThePath("isMergeBranch_NonConflictingChanges_CanBeMerged");
        commitToRepo();

        //create branch f1 and commit changes
        String branch = gitExecutor.createAndCheckoutToBranch(path, "f1").block();
        createFileInThePath("isMergeBranch_NonConflictingChanges_f1");

        //Create branch f2 from f1
        gitExecutor.checkoutToBranch(path, "main");
        gitExecutor.createAndCheckoutToBranch(path, "f2").block();
        createFileInThePath("isMergeBranch_NonConflictingChanges_f2");

        Mono<MergeStatus> mergeableStatus = gitExecutor.isMergeBranch(path, "f1", "f2");

        StepVerifier
                .create(mergeableStatus)
                .assertNext( s -> {
                    assertThat(s.isMerge());
                })
                .verifyComplete();

    }


    // TODO cover the below mentioned test cases
    /*
     * Merge conflicts
     * Merge invalid branch
     * Merge with no changes
     * Merge with valid data
     * Clone with invalid keys
     * Clone with invalid remote
     * Clone with valid data
     * */
}