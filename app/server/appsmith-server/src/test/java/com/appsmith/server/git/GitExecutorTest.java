package com.appsmith.server.git;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.GitExecutorImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
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
    public void tearDown() throws IOException {
        git.getRepository().close();
        FileUtils.deleteDirectory(path.toFile());
    }

    private void createFileInThePath(String fileName) throws IOException {
        File file = new File(path.toString().replace(".git", "") + "/" + fileName);
        FileUtils.writeStringToFile(file, "Add test data", "UTF-8", false);
    }

    private void commitToRepo() {
        gitExecutor.commitApplication(path, "Test commit", "test", "test@test.com", false).block();
    }

    @Test
    public void commit_validChange_Success() throws IOException {
        createFileInThePath("TestFIle2");
        String commitStatus = gitExecutor.commitApplication(path, "Test commit", "test", "test@test.com", false).block();
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
    public void createBranch_validName_success() throws IOException {
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

        Mono<MergeStatusDTO> mergeableStatus = gitExecutor.isMergeBranch(path, "f1", "f2");

        StepVerifier
                .create(mergeableStatus)
                .assertNext( s -> {
                    assertThat(s.isMergeAble());
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

        Mono<MergeStatusDTO> mergeableStatus = gitExecutor.isMergeBranch(path, "f1", "f2");

        StepVerifier
                .create(mergeableStatus)
                .assertNext( s -> {
                    assertThat(s.isMergeAble());
                })
                .verifyComplete();

    }

    @Test
    public void checkoutBranch_InvalidBranchName_ThrowError() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        String defaultBranch = git.getRepository().getBranch();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "main1");

        StepVerifier
                .create(branchStatus)
                .expectErrorMatches(throwable -> throwable instanceof RefNotFoundException
                        && throwable.getMessage().contains("Ref main1 cannot be resolved"));
    };

    @Test
    public void checkoutBranch_ValidBranchName_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        String defaultBranch = git.getRepository().getBranch();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "main");

        StepVerifier
                .create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    };

    @Test
    public void checkoutBranch_NothingToCommit_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        String defaultBranch = git.getRepository().getBranch();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "master");

        StepVerifier
                .create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                    try {
                        assertThat("master").isEqualTo(git.getRepository().getBranch());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    };

    @Test
    public void checkoutBranch_ModifiedFilesNonConflictingChanges_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();

        String defaultBranch = git.getRepository().getBranch();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        createFileInThePath("TestFile6");
        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "master");

        StepVerifier
                .create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                    try {
                        assertThat("master").isEqualTo(git.getRepository().getBranch());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    };

    @Test
    public void checkoutBranch_ModifiedFileContent_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git",""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", false);
        String defaultBranch = git.getRepository().getBranch();

        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "master");

        StepVerifier
                .create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                    try {
                        assertThat("master").isEqualTo(git.getRepository().getBranch());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    };

    @Test
    public void listBranches_LocalMode_Success() throws IOException {
        createFileInThePath("listBranch");
        commitToRepo();
        String branchMono = gitExecutor.createAndCheckoutToBranch(path, "test1")
                .flatMap(s -> gitExecutor.createAndCheckoutToBranch(path, "test2")).block();
        Mono<List<GitBranchDTO>> gitBranchDTOMono = gitExecutor.listBranches(path, "remoteUrl", "publicKey", "privateKey", false);
        StepVerifier
                .create(gitBranchDTOMono)
                .assertNext(gitBranchDTOS -> {
                   assertThat(gitBranchDTOS.stream().count()).isEqualTo(3);
                   
                });
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