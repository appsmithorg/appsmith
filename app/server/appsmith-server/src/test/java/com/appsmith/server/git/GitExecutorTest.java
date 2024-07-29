package com.appsmith.server.git;

import com.appsmith.external.constants.Assets;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.GitExecutorImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
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
@SpringBootTest
public class GitExecutorTest {

    @Autowired
    private GitExecutor gitExecutor;

    @Autowired
    private GitServiceConfig gitServiceConfig;

    @TempDir
    private File tempFolder = new File("./");

    private Git git;

    private Path path;

    @BeforeEach
    public void setUp() throws GitAPIException {
        git = Git.init().setDirectory(tempFolder).call();
        path = git.getRepository().getDirectory().toPath();
    }

    @AfterEach
    public void tearDown() throws IOException {
        git.getRepository().close();
        FileUtils.deleteDirectory(path.toFile());
    }

    private void createFileInThePath(String fileName) throws IOException {
        File file = new File(path.toString().replace(".git", "") + "/" + fileName);
        FileUtils.writeStringToFile(file, "Add test data", "UTF-8", false);
    }

    private void writeFileInThePath(String fileName, String data) throws IOException {
        File file = new File(path.toString().replace(".git", "") + "/" + fileName);
        FileUtils.writeStringToFile(file, data, "UTF-8", false);
    }

    private void removeFileFromThePath(String fileName) throws IOException {
        File file = new File(path.toString().replace(".git", "") + "/" + fileName);
        FileUtils.forceDelete(file);
    }

    private void commitToRepo() {
        gitExecutor
                .commitArtifact(path, "Test commit", "test", "test@test.com", false, false)
                .block();
    }

    @Test
    public void commit_validChange_Success() throws IOException {
        createFileInThePath("TestFIle2");
        String commitStatus = gitExecutor
                .commitArtifact(path, "Test commit", "test", "test@test.com", false, false)
                .block();
        Mono<List<GitLogDTO>> commitList = gitExecutor.getCommitHistory(path);

        StepVerifier.create(commitList).assertNext(list -> {
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

        StepVerifier.create(branchStatus)
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

        StepVerifier.create(branchStatus)
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

        // create branch f1
        gitExecutor.createAndCheckoutToBranch(path, "f1").block();
        // Create branch f2 from f1
        gitExecutor.createAndCheckoutToBranch(path, "f2").block();

        Mono<MergeStatusDTO> mergeableStatus = gitExecutor.isMergeBranch(path, "f1", "f2");

        StepVerifier.create(mergeableStatus)
                .assertNext(s -> {
                    assertThat(s.isMergeAble()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void isMergeBranch_NonConflictingChanges_CanBeMerged() throws IOException, GitAPIException {
        createFileInThePath("isMergeBranch_NonConflictingChanges_CanBeMerged");
        commitToRepo();

        // create branch f1 and commit changes
        String branch = gitExecutor.createAndCheckoutToBranch(path, "f1").block();
        createFileInThePath("isMergeBranch_NonConflictingChanges_f1");

        // Create branch f2 from f1
        gitExecutor.checkoutToBranch(path, "main");
        gitExecutor.createAndCheckoutToBranch(path, "f2").block();
        createFileInThePath("isMergeBranch_NonConflictingChanges_f2");

        Mono<MergeStatusDTO> mergeableStatus = gitExecutor.isMergeBranch(path, "f1", "f2");

        StepVerifier.create(mergeableStatus)
                .assertNext(s -> {
                    assertThat(s.isMergeAble()).isTrue();
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

        StepVerifier.create(branchStatus)
                .expectErrorMatches(throwable -> throwable instanceof RefNotFoundException
                        && throwable.getMessage().contains("Ref main1 cannot be resolved"));
    }

    @Test
    public void checkoutBranch_ValidBranchName_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        String defaultBranch = git.getRepository().getBranch();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "main");

        StepVerifier.create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    }

    @Test
    public void checkoutBranch_NothingToCommit_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        String defaultBranch = git.getRepository().getBranch();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "master");

        StepVerifier.create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                    try {
                        assertThat("master").isEqualTo(git.getRepository().getBranch());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    }

    @Test
    public void checkoutBranch_ModifiedFilesNonConflictingChanges_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();

        String defaultBranch = git.getRepository().getBranch();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        createFileInThePath("TestFile6");
        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "master");

        StepVerifier.create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                    try {
                        assertThat("master").isEqualTo(git.getRepository().getBranch());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    }

    @Test
    public void checkoutBranch_ModifiedFileContent_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", false);
        String defaultBranch = git.getRepository().getBranch();

        Mono<Boolean> branchStatus = gitExecutor.checkoutToBranch(path, "master");

        StepVerifier.create(branchStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                    try {
                        assertThat("master").isEqualTo(git.getRepository().getBranch());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    }

    @Test
    public void listBranches_LocalMode_Success() throws IOException {
        createFileInThePath("listBranch");
        commitToRepo();
        Mono<String> branchMono = gitExecutor
                .createAndCheckoutToBranch(path, "test1")
                .flatMap(s -> gitExecutor.createAndCheckoutToBranch(path, "test2"));
        Mono<List<GitBranchDTO>> gitBranchDTOMono = branchMono.then(gitExecutor.listBranches(path));

        StepVerifier.create(gitBranchDTOMono).assertNext(gitBranchDTOS -> {
            assertThat(gitBranchDTOS.stream().count()).isEqualTo(3);
        });
    }

    @Test
    public void mergeBranch_WithOutConflicts_Success() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", false);
        commitToRepo();
        String defaultBranch = git.getRepository().getBranch();

        Mono<String> mergeStatusDTOMono = gitExecutor.mergeBranch(path, defaultBranch, "master");

        StepVerifier.create(mergeStatusDTOMono)
                .assertNext(s -> {
                    assertThat(s).isEqualTo("FAST_FORWARD");
                })
                .verifyComplete();
    }

    @Test
    public void mergeBranch_WithConflicts_Failure() throws IOException {

        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "test1").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", true);
        commitToRepo();

        // Create a 2nd branch
        gitExecutor.checkoutToBranch(path, "master").block();
        gitExecutor.createAndCheckoutToBranch(path, "test2").block();
        filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Added test data", "UTF-8", true);
        commitToRepo();

        String defaultBranch = git.getRepository().getBranch();

        Mono<String> mergeStatusDTOMono = gitExecutor.mergeBranch(path, "test1", "test2");

        StepVerifier.create(mergeStatusDTOMono)
                .assertNext(s -> assertThat(s).isEqualTo("CONFLICTING"))
                .verifyComplete();
    }

    @Test
    public void mergeBranch_NoChanges_SuccessUpToDate() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "test1").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", false);
        commitToRepo();

        // Create a 2nd branch
        gitExecutor.createAndCheckoutToBranch(path, "test2").block();
        filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Added test data", "UTF-8", false);
        commitToRepo();

        String defaultBranch = git.getRepository().getBranch();

        Mono<String> mergeStatusDTOMono = gitExecutor.mergeBranch(path, "test1", "test2");

        StepVerifier.create(mergeStatusDTOMono)
                .assertNext(s -> assertThat(s).isEqualTo("ALREADY_UP_TO_DATE"))
                .verifyComplete();
    }

    @Test
    public void mergeBranchStatus_WithOutConflicts_Mergeable() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "main").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", false);
        commitToRepo();
        String defaultBranch = git.getRepository().getBranch();

        Mono<MergeStatusDTO> mergeStatusDTOMono = gitExecutor.isMergeBranch(path, defaultBranch, "master");

        StepVerifier.create(mergeStatusDTOMono)
                .assertNext(mergeStatusDTO -> {
                    assertThat(mergeStatusDTO.isMergeAble()).isEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    }

    @Test
    public void mergeBranchStatus_NoChanges_Mergeable() throws IOException {
        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "test1").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", false);
        commitToRepo();

        // Create a 2nd branch
        gitExecutor.createAndCheckoutToBranch(path, "test2").block();
        filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Added test data", "UTF-8", false);
        commitToRepo();

        Mono<MergeStatusDTO> mergeStatusDTOMono = gitExecutor.isMergeBranch(path, "test1", "test2");

        StepVerifier.create(mergeStatusDTOMono)
                .assertNext(mergeStatusDTO -> {
                    assertThat(mergeStatusDTO.isMergeAble()).isEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    }

    @Test
    public void mergeBranchStatus_WithConflicts_ShowConflictFiles() throws IOException {

        createFileInThePath("TestFIle4");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "test1").block();
        Path filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Conflicts added TestFIle4", "UTF-8", true);
        commitToRepo();

        // Create a 2nd branch
        gitExecutor.checkoutToBranch(path, "master").block();
        gitExecutor.createAndCheckoutToBranch(path, "test2").block();
        filePath = Paths.get(String.valueOf(path).replace("/.git", ""), "TestFIle4");
        FileUtils.writeStringToFile(filePath.toFile(), "Added test data", "UTF-8", true);
        commitToRepo();

        String defaultBranch = git.getRepository().getBranch();

        Mono<MergeStatusDTO> mergeStatusDTOMono = gitExecutor.isMergeBranch(path, "test1", "test2");

        StepVerifier.create(mergeStatusDTOMono)
                .assertNext(mergeStatusDTO -> {
                    assertThat(mergeStatusDTO.isMergeAble()).isEqualTo(Boolean.FALSE);
                    assertThat(mergeStatusDTO.getConflictingFiles()).hasSize(1);
                    assertThat(mergeStatusDTO.getConflictingFiles().get(0)).isEqualTo("TestFIle4");
                })
                .verifyComplete();
    }

    @Test
    public void getCommitHistory_EmptyRepo_Error() {
        Mono<List<GitLogDTO>> status = gitExecutor.getCommitHistory(path);

        StepVerifier.create(status)
                .expectErrorMatches(throwable -> throwable instanceof NoHeadException)
                .verify();
    }

    @Test
    public void getCommitHistory_NonEmptyRepo_Success() throws IOException {
        createFileInThePath("testFile");
        commitToRepo();
        Mono<List<GitLogDTO>> status = gitExecutor.getCommitHistory(path);

        StepVerifier.create(status)
                .assertNext(gitLogDTOS -> {
                    assertThat(gitLogDTOS).hasSize(1);
                    assertThat(gitLogDTOS.get(0).getCommitMessage()).isEqualTo("Test commit");
                    assertThat(gitLogDTOS.get(0).getAuthorName()).isEqualTo("test");
                    assertThat(gitLogDTOS.get(0).getAuthorEmail()).isEqualTo("test@test.com");
                })
                .verifyComplete();
    }

    @Test
    public void deleteBranch_validBranch_Success() throws IOException {
        createFileInThePath("testFile");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "test").block();
        gitExecutor.checkoutToBranch(path, "master").block();
        Mono<Boolean> deleteBranchMono = gitExecutor.deleteBranch(path, "test");

        StepVerifier.create(deleteBranchMono)
                .assertNext(deleteStatus -> assertThat(deleteStatus).isEqualTo(Boolean.TRUE))
                .verifyComplete();
    }

    @Test
    public void deleteBranch_emptyRepo_Success() throws IOException {

        Mono<Boolean> deleteBranchMono = gitExecutor.deleteBranch(path, "master");

        StepVerifier.create(deleteBranchMono)
                .assertNext(deleteStatus -> assertThat(deleteStatus).isEqualTo(Boolean.FALSE))
                .verifyComplete();
    }

    @Test
    public void deleteBranch_inValidBranch_Success() throws IOException {
        createFileInThePath("testFile");
        commitToRepo();
        gitExecutor.createAndCheckoutToBranch(path, "test").block();
        gitExecutor.checkoutToBranch(path, "master").block();
        Mono<Boolean> deleteBranchMono = gitExecutor.deleteBranch(path, "**impossibleBranchName**");

        StepVerifier.create(deleteBranchMono)
                .assertNext(deleteStatus -> assertThat(deleteStatus).isEqualTo(Boolean.FALSE))
                .verifyComplete();
    }

    @Test
    public void getStatus_noChangesInBranch_Success() throws IOException {
        createFileInThePath("testFile");
        commitToRepo();
        Mono<GitStatusDTO> gitStatusDTOMono = gitExecutor.getStatus(path, "master");

        StepVerifier.create(gitStatusDTOMono)
                .assertNext(gitStatusDTO -> {
                    assertThat(gitStatusDTO.getIsClean()).isEqualTo(Boolean.TRUE);
                    assertThat(gitStatusDTO.getAheadCount()).isEqualTo(0);
                    assertThat(gitStatusDTO.getBehindCount()).isEqualTo(0);
                    assertThat(gitStatusDTO.getDiscardDocUrl()).isEqualTo(Assets.GIT_DISCARD_DOC_URL);
                })
                .verifyComplete();
    }

    @Test
    public void getStatus_ChangesInBranch_Success() throws IOException {
        createFileInThePath("testFile");
        commitToRepo();
        createFileInThePath("testFile2");
        Mono<GitStatusDTO> gitStatusDTOMono = gitExecutor.getStatus(path, "master");

        StepVerifier.create(gitStatusDTOMono)
                .assertNext(gitStatusDTO -> {
                    assertThat(gitStatusDTO.getIsClean()).isEqualTo(Boolean.FALSE);
                    assertThat(gitStatusDTO.getAheadCount()).isEqualTo(0);
                    assertThat(gitStatusDTO.getBehindCount()).isEqualTo(0);
                })
                .verifyComplete();
    }

    @Test
    public void getStatus_ChangeInPages_Success() throws IOException {
        createFileInThePath("pages/Page1/Page1.json");
        createFileInThePath("pages/Page2/Page2.json");
        commitToRepo();
        removeFileFromThePath("pages/Page1/Page1.json");
        writeFileInThePath("pages/Page2/Page2.json", "page2");
        createFileInThePath("pages/Page3/Page3.json");

        Mono<GitStatusDTO> gitStatusDTOMono = gitExecutor.getStatus(path, "master");
        StepVerifier.create(gitStatusDTOMono)
                .assertNext(gitStatusDTO -> {
                    assertThat(gitStatusDTO.getIsClean()).isEqualTo(Boolean.FALSE);
                    assertThat(gitStatusDTO.getRemoved()).contains("pages/Page1/Page1.json");
                    assertThat(gitStatusDTO.getPagesRemoved()).contains("Page1");
                    assertThat(gitStatusDTO.getModified()).contains("pages/Page2/Page2.json");
                    assertThat(gitStatusDTO.getPagesModified()).contains("Page2");
                    assertThat(gitStatusDTO.getAdded()).contains("pages/Page3/Page3.json");
                    assertThat(gitStatusDTO.getPagesAdded()).contains("Page3");
                    assertThat(gitStatusDTO.getModifiedPages()).isEqualTo(3);
                })
                .verifyComplete();
    }

    @Test
    public void getStatus_ChangeInQueries_Success() throws IOException {
        createFileInThePath("pages/Page1/Page1.json");
        createFileInThePath("pages/Page1/queries/query_1/metadata.json");
        createFileInThePath("pages/Page1/queries/query_1/query_1.txt");
        createFileInThePath("pages/Page1/queries/query_2/metadata.json");
        createFileInThePath("pages/Page1/queries/query_2/query_2.txt");
        commitToRepo();
        removeFileFromThePath("pages/Page1/queries/query_1/metadata.json");
        removeFileFromThePath("pages/Page1/queries/query_1/query_1.txt");
        writeFileInThePath("pages/Page1/queries/query_2/metadata.json", "query2");
        writeFileInThePath("pages/Page1/queries/query_2/query_2.txt", "query2");
        createFileInThePath("pages/Page1/queries/query_3/metadata.json");
        createFileInThePath("pages/Page1/queries/query_3/query_3.txt");

        Mono<GitStatusDTO> gitStatusDTOMono = gitExecutor.getStatus(path, "master");
        StepVerifier.create(gitStatusDTOMono)
                .assertNext(gitStatusDTO -> {
                    assertThat(gitStatusDTO.getIsClean()).isEqualTo(Boolean.FALSE);
                    assertThat(gitStatusDTO.getPagesModified()).doesNotContain("Page1");
                    assertThat(gitStatusDTO.getRemoved())
                            .contains(
                                    "pages/Page1/queries/query_1/metadata.json",
                                    "pages/Page1/queries/query_1/query_1.txt");
                    assertThat(gitStatusDTO.getQueriesRemoved()).contains("Page1/query_1");
                    assertThat(gitStatusDTO.getModified())
                            .contains(
                                    "pages/Page1/queries/query_2/metadata.json",
                                    "pages/Page1/queries/query_2/query_2.txt");
                    assertThat(gitStatusDTO.getQueriesModified()).contains("Page1/query_2");
                    assertThat(gitStatusDTO.getAdded())
                            .contains(
                                    "pages/Page1/queries/query_3/metadata.json",
                                    "pages/Page1/queries/query_3/query_3.txt");
                    assertThat(gitStatusDTO.getQueriesAdded()).contains("Page1/query_3");
                    assertThat(gitStatusDTO.getModifiedQueries()).isEqualTo(3);
                })
                .verifyComplete();
    }

    @Test
    public void getStatus_ChangeInJsObjects_Success() throws IOException {
        createFileInThePath("pages/Page1/Page1.json");
        createFileInThePath("pages/Page1/jsobjects/jsobject_1/metadata.json");
        createFileInThePath("pages/Page1/jsobjects/jsobject_1/jsobject_1.js");
        createFileInThePath("pages/Page1/jsobjects/jsobject_2/metadata.json");
        createFileInThePath("pages/Page1/jsobjects/jsobject_2/jsobject_2.js");
        commitToRepo();
        removeFileFromThePath("pages/Page1/jsobjects/jsobject_1/metadata.json");
        removeFileFromThePath("pages/Page1/jsobjects/jsobject_1/jsobject_1.js");
        writeFileInThePath("pages/Page1/jsobjects/jsobject_2/metadata.json", "js2");
        writeFileInThePath("pages/Page1/jsobjects/jsobject_2/jsobject_2.js", "js2");
        createFileInThePath("pages/Page1/jsobjects/jsobject_3/metadata.json");
        createFileInThePath("pages/Page1/jsobjects/jsobject_3/jsobject_3.js");

        Mono<GitStatusDTO> gitStatusDTOMono = gitExecutor.getStatus(path, "master");
        StepVerifier.create(gitStatusDTOMono)
                .assertNext(gitStatusDTO -> {
                    assertThat(gitStatusDTO.getIsClean()).isEqualTo(Boolean.FALSE);
                    assertThat(gitStatusDTO.getPagesModified()).doesNotContain("Page1");
                    assertThat(gitStatusDTO.getRemoved())
                            .contains(
                                    "pages/Page1/jsobjects/jsobject_1/metadata.json",
                                    "pages/Page1/jsobjects/jsobject_1/jsobject_1.js");
                    assertThat(gitStatusDTO.getJsObjectsRemoved()).contains("Page1/jsobject_1");
                    assertThat(gitStatusDTO.getModified())
                            .contains(
                                    "pages/Page1/jsobjects/jsobject_2/metadata.json",
                                    "pages/Page1/jsobjects/jsobject_2/jsobject_2.js");
                    assertThat(gitStatusDTO.getJsObjectsModified()).contains("Page1/jsobject_2");
                    assertThat(gitStatusDTO.getAdded())
                            .contains(
                                    "pages/Page1/jsobjects/jsobject_3/metadata.json",
                                    "pages/Page1/jsobjects/jsobject_3/jsobject_3.js");
                    assertThat(gitStatusDTO.getJsObjectsAdded()).contains("Page1/jsobject_3");
                    assertThat(gitStatusDTO.getModifiedJSObjects()).isEqualTo(3);
                })
                .verifyComplete();
    }

    @Test
    public void getStatus_ChangeInDatasources_Success() throws IOException {
        createFileInThePath("datasources/ds1.json");
        createFileInThePath("datasources/ds2.json");
        commitToRepo();
        removeFileFromThePath("datasources/ds1.json");
        writeFileInThePath("datasources/ds2.json", "ds2");
        createFileInThePath("datasources/ds3.json");

        Mono<GitStatusDTO> gitStatusDTOMono = gitExecutor.getStatus(path, "master");
        StepVerifier.create(gitStatusDTOMono)
                .assertNext(gitStatusDTO -> {
                    assertThat(gitStatusDTO.getIsClean()).isEqualTo(Boolean.FALSE);
                    assertThat(gitStatusDTO.getRemoved()).contains("datasources/ds1.json");
                    assertThat(gitStatusDTO.getDatasourcesRemoved()).contains("ds1");
                    assertThat(gitStatusDTO.getModified()).contains("datasources/ds2.json");
                    assertThat(gitStatusDTO.getDatasourcesModified()).contains("ds2");
                    assertThat(gitStatusDTO.getAdded()).contains("datasources/ds3.json");
                    assertThat(gitStatusDTO.getDatasourcesAdded()).contains("ds3");
                    assertThat(gitStatusDTO.getModifiedDatasources()).isEqualTo(3);
                })
                .verifyComplete();
    }

    @Test
    public void getStatus_ChangeInJsLibs_Success() throws IOException {
        createFileInThePath("jslibs/lib1_12345678.json");
        createFileInThePath("jslibs/lib_2_12345678.json");
        commitToRepo();
        removeFileFromThePath("jslibs/lib1_12345678.json");
        writeFileInThePath("jslibs/lib_2_12345678.json", "lib_2_12345678");
        createFileInThePath("jslibs/lib3_12345678.json");

        Mono<GitStatusDTO> gitStatusDTOMono = gitExecutor.getStatus(path, "master");
        StepVerifier.create(gitStatusDTOMono)
                .assertNext(gitStatusDTO -> {
                    assertThat(gitStatusDTO.getIsClean()).isEqualTo(Boolean.FALSE);
                    assertThat(gitStatusDTO.getRemoved()).contains("jslibs/lib1_12345678.json");
                    assertThat(gitStatusDTO.getJsLibsRemoved()).contains("lib1");
                    assertThat(gitStatusDTO.getModified()).contains("jslibs/lib_2_12345678.json");
                    assertThat(gitStatusDTO.getJsLibsModified()).contains("lib_2");
                    assertThat(gitStatusDTO.getAdded()).contains("jslibs/lib3_12345678.json");
                    assertThat(gitStatusDTO.getJsLibsAdded()).contains("lib3");
                    assertThat(gitStatusDTO.getModifiedJSLibs()).isEqualTo(3);
                })
                .verifyComplete();
    }

    @Test
    public void resetToLastCommit_WithOutStaged_CleanStateForRepo() throws IOException, GitAPIException {
        createFileInThePath("testFile");
        commitToRepo();
        Mono<Boolean> resetStatus = gitExecutor.resetToLastCommit(path, "master");

        StepVerifier.create(resetStatus)
                .assertNext(status -> {
                    assertThat(status).isEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    }

    // TODO cover the below mentioned test cases
    /*
     * resetToLastCommit
     * Clone
     * */
}
