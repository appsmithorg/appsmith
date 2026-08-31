package com.appsmith.git.service;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@code upload_branches_to_redis_hash} in {@code git.sh}.
 *
 * <p>The Redis dependency is stubbed by overriding the {@code redis-exec} function after sourcing
 * the script, recording every invocation to a log file that the assertions inspect.
 */
public class GitBranchStoreUploadTest {

    private static final String BRANCH_STORE_KEY = "test_branch_store";

    private static Path gitShPath;

    @BeforeAll
    static void locateGitScript() throws Exception {
        var resource = GitBranchStoreUploadTest.class.getClassLoader().getResource("git.sh");
        assertThat(resource).as("git.sh on classpath").isNotNull();
        gitShPath = Paths.get(resource.toURI());
    }

    @Test
    @DisplayName("skips HSET entirely when the repository has no local branches")
    void skipsHsetForEmptyBranchSet(@TempDir Path tempDir) throws Exception {
        Path repo = tempDir.resolve("empty-repo");
        Files.createDirectories(repo);
        runGit(repo, "init", "-b", "main");

        Path callLog = tempDir.resolve("redis-calls.log");
        int exitCode = runUploadBranches(repo, callLog);
        List<String> calls = readCalls(callLog);

        assertThat(exitCode).isZero();
        assertThat(calls).anyMatch(call -> call.startsWith("DEL " + BRANCH_STORE_KEY));
        assertThat(calls).noneMatch(call -> call.contains("HSET"));
    }

    @Test
    @DisplayName("uploads branch/sha pairs without literal quote characters")
    void uploadsUnquotedBranchShaPairs(@TempDir Path tempDir) throws Exception {
        Path repo = tempDir.resolve("repo-with-branches");
        initRepositoryWithCommit(repo);
        runGit(repo, "branch", "feature");

        Path callLog = tempDir.resolve("redis-calls.log");
        int exitCode = runUploadBranches(repo, callLog);
        List<String> calls = readCalls(callLog);

        assertThat(exitCode).isZero();
        assertThat(calls).anyMatch(call -> call.startsWith("DEL " + BRANCH_STORE_KEY));

        List<String> hsetCalls =
                calls.stream().filter(call -> call.startsWith("HSET ")).toList();
        assertThat(hsetCalls).hasSize(1);

        String hset = hsetCalls.get(0);
        assertThat(hset).doesNotContain("\"");
        assertThat(hset).matches("^HSET " + BRANCH_STORE_KEY + "( \\S+ [0-9a-f]{4,40}){2}$");
        assertThat(hset).contains(" main ").contains(" feature ");
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

    private static int runUploadBranches(Path repo, Path callLog) throws IOException, InterruptedException {
        String script = String.format(
                "source '%s'%n" + "redis-exec() { printf '%%s\\n' \"${*:2}\" >> '%s'; }%n"
                        + "upload_branches_to_redis_hash '%s' 'redis://stub:6379' '%s'",
                gitShPath.toAbsolutePath(), callLog.toAbsolutePath(), repo.toAbsolutePath(), BRANCH_STORE_KEY);

        Process process =
                new ProcessBuilder("bash", "-c", script).redirectErrorStream(true).start();

        if (!process.waitFor(30, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            return -1;
        }

        return process.exitValue();
    }

    private static List<String> readCalls(Path callLog) throws IOException {
        return Files.exists(callLog) ? Files.readAllLines(callLog) : List.of();
    }
}
