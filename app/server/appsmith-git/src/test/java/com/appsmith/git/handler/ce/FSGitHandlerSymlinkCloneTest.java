package com.appsmith.git.handler.ce;

import com.appsmith.external.configurations.git.GitConfig;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import io.micrometer.observation.ObservationRegistry;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;

/**
 * GHSA-fqwc-g9wm-5895: Git import symlink path traversal.
 *
 * <p>A malicious repository can commit a symbolic link (git mode 120000) pointing at an arbitrary
 * server path. When cloned, JGit's default behaviour materializes it as a real filesystem symlink
 * inside the Git root; subsequent file reads/writes follow it, enabling arbitrary file read/write.
 * The fix disables symlink support ({@code core.symlinks=false}) before checkout so the entry is
 * written as an inert regular file.
 */
public class FSGitHandlerSymlinkCloneTest {

    private FSGitHandlerCEImpl newFSGitHandler() {
        GitServiceConfig gitServiceConfig = new GitServiceConfig();
        GitConfig gitConfig = Mockito.mock(GitConfig.class);
        return new FSGitHandlerCEImpl(gitServiceConfig, gitConfig, ObservationRegistry.NOOP, ObservationHelper.NOOP);
    }

    private String buildSourceRepoWithSymlink(Path srcDir) throws Exception {
        try (Git srcGit = Git.init().setDirectory(srcDir.toFile()).call()) {
            Files.writeString(srcDir.resolve("normal.txt"), "hello");
            Files.createSymbolicLink(srcDir.resolve("evil.txt"), Path.of("/etc/passwd"));
            srcGit.add().addFilepattern(".").call();
            srcGit.commit()
                    .setMessage("init")
                    .setSign(false)
                    .setAuthor("tester", "tester@appsmith.test")
                    .setCommitter("tester", "tester@appsmith.test")
                    .call();
        }
        return srcDir.toUri().toString();
    }

    @Test
    public void cloneRepoWithSymlinkEntry_isCheckedOutAsRegularFile_GHSA_fqwc() throws Exception {
        Path srcDir = Files.createTempDirectory("ghsa-fqwc-src");
        Path controlRoot = Files.createTempDirectory("ghsa-fqwc-control");
        Path fixRoot = Files.createTempDirectory("ghsa-fqwc-fix");
        try {
            String uri = buildSourceRepoWithSymlink(srcDir);

            // Control: a default checkout materializes the entry as a REAL symlink (the vulnerability).
            File controlDest = controlRoot.resolve("clone").toFile();
            try (Git control =
                    Git.cloneRepository().setURI(uri).setDirectory(controlDest).call()) {
                Path controlEvil = controlDest.toPath().resolve("evil.txt");
                Assertions.assertTrue(
                        Files.isSymbolicLink(controlEvil),
                        "Sanity check: without hardening JGit materializes a real symlink");
            }

            // Fix: normal clone, then removeSymlinksAfterClone converts them to regular files.
            File dest = fixRoot.resolve("clone").toFile();
            try (Git cloned =
                    Git.cloneRepository().setURI(uri).setDirectory(dest).call()) {

                newFSGitHandler().removeSymlinksAfterClone(cloned);

                Path evil = dest.toPath().resolve("evil.txt");
                Assertions.assertTrue(Files.exists(evil, LinkOption.NOFOLLOW_LINKS), "The entry should be checked out");
                Assertions.assertFalse(
                        Files.isSymbolicLink(evil),
                        "With core.symlinks=false the entry must be a regular file, not a symlink");
                Assertions.assertTrue(Files.isRegularFile(evil, LinkOption.NOFOLLOW_LINKS));
                Assertions.assertEquals(
                        "/etc/passwd",
                        Files.readString(evil).trim(),
                        "The symlink target text is stored as plain file content");
                Assertions.assertEquals("hello", Files.readString(dest.toPath().resolve("normal.txt")));
            }
        } finally {
            FileUtils.deleteDirectory(srcDir.toFile());
            FileUtils.deleteDirectory(controlRoot.toFile());
            FileUtils.deleteDirectory(fixRoot.toFile());
        }
    }
}
