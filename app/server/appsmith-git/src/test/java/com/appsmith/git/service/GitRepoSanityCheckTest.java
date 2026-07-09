package com.appsmith.git.service;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@code verify_git_repo_sanity} in {@code git.sh}.
 */
public class GitRepoSanityCheckTest {

    private static Path gitShPath;

    @BeforeAll
    static void locateGitScript() throws Exception {
        var resource = GitRepoSanityCheckTest.class.getClassLoader().getResource("git.sh");
        assertThat(resource).as("git.sh on classpath").isNotNull();
        gitShPath = Paths.get(resource.toURI());
    }

    @Test
    @DisplayName("passes for a valid git repository")
    void passesForValidRepository(@TempDir Path tempDir) throws Exception {
        Path repo = tempDir.resolve("valid-repo");
        initRepositoryWithCommit(repo);

        assertThat(runVerifyGitRepoSanity(repo)).isZero();
    }

    @Test
    @DisplayName("fails when directory has no .git")
    void failsForEmptyDirectory(@TempDir Path tempDir) throws Exception {
        Path repo = tempDir.resolve("empty-dir");
        Files.createDirectories(repo);

        assertThat(runVerifyGitRepoSanity(repo)).isEqualTo(1);
    }

    @Test
    @DisplayName("fails when .git exists but HEAD is missing")
    void failsWhenHeadIsMissing(@TempDir Path tempDir) throws Exception {
        Path repo = tempDir.resolve("partial-git");
        Files.createDirectories(repo.resolve(".git"));

        assertThat(runVerifyGitRepoSanity(repo)).isEqualTo(1);
    }

    @Test
    @DisplayName("fails when .git is a file instead of a directory")
    void failsWhenGitDirIsAFile(@TempDir Path tempDir) throws Exception {
        Path repo = tempDir.resolve("broken-git");
        Files.createDirectories(repo);
        Files.writeString(repo.resolve(".git"), "not-a-directory");

        assertThat(runVerifyGitRepoSanity(repo)).isEqualTo(1);
    }

    private static void initRepositoryWithCommit(Path repo) throws IOException, InterruptedException {
        Files.createDirectories(repo);
        runGit(repo, "init", "-b", "main");
        runGit(
                repo,
                "-c",
                "user.email=test@appsmith.com",
                "-c",
                "user.name=Test User",
                "commit",
                "--allow-empty",
                "-m",
                "init");
    }

    private static void runGit(Path repo, String... args) throws IOException, InterruptedException {
        String[] command = new String[args.length + 3];
        command[0] = "git";
        command[1] = "-C";
        command[2] = repo.toAbsolutePath().toString();
        System.arraycopy(args, 0, command, 3, args.length);

        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        int exitCode = process.waitFor(30, TimeUnit.SECONDS) ? process.exitValue() : -1;
        assertThat(exitCode).as("git %s", String.join(" ", args)).isZero();
    }

    private static int runVerifyGitRepoSanity(Path repo) throws IOException, InterruptedException {
        String command = String.format(
                "source '%s' && verify_git_repo_sanity '%s'", gitShPath.toAbsolutePath(), repo.toAbsolutePath());

        Process process = new ProcessBuilder("bash", "-c", command)
                .redirectErrorStream(true)
                .start();

        if (!process.waitFor(30, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            return -1;
        }

        return process.exitValue();
    }
}
