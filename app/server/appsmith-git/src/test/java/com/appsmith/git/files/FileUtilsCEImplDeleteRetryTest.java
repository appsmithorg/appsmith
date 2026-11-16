package com.appsmith.git.files;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.files.operations.FileOperationsImpl;
import com.appsmith.git.handler.FSGitHandlerImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledOnOs;
import org.junit.jupiter.api.condition.OS;
import org.mockito.Mockito;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.FileSystemException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileUtilsCEImplDeleteRetryTest {

    private static final String LOCAL_TEST_DIRECTORY = "localTestDirectoryDeleteRetry";
    private static final Path LOCAL_TEST_DIRECTORY_PATH = Path.of(LOCAL_TEST_DIRECTORY);

    private FileUtilsImpl fileUtils;

    @BeforeEach
    void setUp() {
        FSGitHandler fsGitHandler = Mockito.mock(FSGitHandlerImpl.class);
        GitServiceConfig gitServiceConfig = new GitServiceConfig();
        gitServiceConfig.setGitRootPath(LOCAL_TEST_DIRECTORY_PATH.toString());
        FileOperations fileOperations = new FileOperationsImpl(null, ObservationHelper.NOOP);
        fileUtils = new FileUtilsImpl(
                gitServiceConfig, fsGitHandler, fileOperations, ObservationHelper.NOOP, new ObjectMapper());
    }

    @AfterEach
    void tearDown() throws IOException {
        if (Files.exists(LOCAL_TEST_DIRECTORY_PATH)) {
            // Restore permissions so cleanup can succeed after the failure test.
            Files.walk(LOCAL_TEST_DIRECTORY_PATH).forEach(path -> {
                try {
                    if (Files.isDirectory(path)) {
                        Files.setPosixFilePermissions(path, PosixFilePermissions.fromString("rwxr-xr-x"));
                    } else {
                        Files.setPosixFilePermissions(path, PosixFilePermissions.fromString("rw-r--r--"));
                    }
                } catch (IOException | UnsupportedOperationException ignored) {
                    // Best-effort restore on non-POSIX or already-deleted paths.
                }
            });
            FileUtils.deleteDirectory(LOCAL_TEST_DIRECTORY_PATH.toFile());
        }
    }

    @Test
    void should_returnTrueAndRemoveParent_when_deleteLocalRepoSucceeds() throws IOException {
        // Given
        Path repoSuffix = Path.of("workspace1", "app1", "repo1");
        Path repoPath = LOCAL_TEST_DIRECTORY_PATH.resolve(repoSuffix);
        Files.createDirectories(repoPath);
        Files.writeString(repoPath.resolve("README.md"), "hello");
        Path appParent = LOCAL_TEST_DIRECTORY_PATH.resolve("workspace1").resolve("app1");
        assertThat(Files.exists(appParent)).isTrue();

        // When / Then
        StepVerifier.create(fileUtils.deleteLocalRepo(repoSuffix))
                .assertNext(result -> assertThat(result).isTrue())
                .verifyComplete();
        assertThat(Files.exists(appParent)).isFalse();
    }

    @Test
    void should_returnFalse_when_checkIfDirectoryIsEmptyFindsDisallowedFile() throws IOException {
        // Given — a non-allowed file is cleaned up and the check reports not-empty
        Path repoSuffix = Path.of("workspace2", "app2", "repo2");
        Path repoPath = LOCAL_TEST_DIRECTORY_PATH.resolve(repoSuffix);
        Files.createDirectories(repoPath);
        Files.writeString(repoPath.resolve("secret.exe"), "not allowed");

        // When / Then
        StepVerifier.create(fileUtils.checkIfDirectoryIsEmpty(repoSuffix))
                .assertNext(result -> assertThat(result).isFalse())
                .verifyComplete();
        assertThat(Files.exists(repoPath.resolve("secret.exe"))).isFalse();
    }

    @Test
    @EnabledOnOs({OS.LINUX, OS.MAC})
    void should_throwAfterRetries_when_directoryCannotBeDeleted() throws IOException {
        // Given — revoke write on the parent so recursive delete cannot remove the child
        Path target = LOCAL_TEST_DIRECTORY_PATH.resolve("locked-dir");
        Files.createDirectories(target);
        Files.writeString(target.resolve("sticky.txt"), "cannot delete me");
        Files.setPosixFilePermissions(target, PosixFilePermissions.fromString("r-x------"));
        Assumptions.assumeFalse(Files.isWritable(target), "Permissions are not enforced (running as root?)");

        // When / Then — zero delay so the test stays fast; still exercises bounded attempts
        assertThatThrownBy(() -> fileUtils.deleteDirectoryWithRetry(target, 3, 0L))
                .isInstanceOf(FileSystemException.class);
        assertThat(Files.exists(target)).isTrue();
    }

    @Test
    @EnabledOnOs({OS.LINUX, OS.MAC})
    void should_errorFromDeleteLocalRepo_when_retriesExhausted() throws IOException {
        // Given — same lock setup under the path deleteLocalRepo targets (parent of repoSuffix)
        Path repoSuffix = Path.of("workspace3", "app3", "repo3");
        Path appParent = LOCAL_TEST_DIRECTORY_PATH.resolve("workspace3").resolve("app3");
        Files.createDirectories(LOCAL_TEST_DIRECTORY_PATH.resolve(repoSuffix));
        Files.writeString(appParent.resolve("sticky.txt"), "cannot delete me");
        Files.setPosixFilePermissions(appParent, PosixFilePermissions.fromString("r-x------"));
        Assumptions.assumeFalse(Files.isWritable(appParent), "Permissions are not enforced (running as root?)");

        // When / Then — production delay is 100ms × 2 waits; bound the wait so a hang would fail the test
        StepVerifier.create(fileUtils.deleteLocalRepo(repoSuffix))
                .expectError(FileSystemException.class)
                .verify(Duration.ofSeconds(5));
    }
}
