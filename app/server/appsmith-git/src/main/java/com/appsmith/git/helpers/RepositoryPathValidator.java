package com.appsmith.git.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Resolves a file path that is relative to a Git repository directory, and requires the result to
 * stay inside that repository directory.
 *
 * <p>A relative path is accepted when all of these hold:
 * <ul>
 *   <li>It is not absolute and it has no parent-directory segment.</li>
 *   <li>It names a file or directory below the repository directory, not the repository directory itself.</li>
 *   <li>It is not inside the {@code .git} directory of the repository.</li>
 *   <li>The real location of its parent directory, after symbolic links are resolved, is inside the
 *       repository directory and not inside its {@code .git} directory.</li>
 * </ul>
 */
@Slf4j
public final class RepositoryPathValidator {

    public static final String OUTSIDE_REPOSITORY_MESSAGE =
            "SECURITY: Refused a Git file operation on a path outside the repository directory";

    public static final String UNRESOLVED_PATH_MESSAGE =
            "SECURITY: Unable to resolve the real path while validating a Git repository file path";

    private static final String PARENT_DIRECTORY_SEGMENT = "..";

    private static final String GIT_METADATA_DIRECTORY = ".git";

    private RepositoryPathValidator() {}

    /**
     * Resolves a path that a file will be written to. The target itself must not be a symbolic link,
     * because a write follows the link.
     *
     * @return the normalized absolute path inside the repository directory
     * @throws AppsmithPluginException if the path is not accepted, or its real path cannot be resolved
     */
    public static Path resolveForWrite(Path repositoryDirectory, String relativePath) {
        Path target = resolveWithinRepository(repositoryDirectory, relativePath);
        if (Files.isSymbolicLink(target)) {
            throw outsideRepository();
        }
        return target;
    }

    /**
     * Resolves a path that will be deleted. The target itself may be a symbolic link, because a
     * delete removes the link and not the file it points to.
     *
     * @return the normalized absolute path inside the repository directory
     * @throws AppsmithPluginException if the path is not accepted, or its real path cannot be resolved
     */
    public static Path resolveForDelete(Path repositoryDirectory, String relativePath) {
        return resolveWithinRepository(repositoryDirectory, relativePath);
    }

    private static Path resolveWithinRepository(Path repositoryDirectory, String relativePath) {
        Path repository = repositoryDirectory.toAbsolutePath().normalize();
        Path relative = toRelativePath(relativePath);

        for (Path segment : relative) {
            if (PARENT_DIRECTORY_SEGMENT.equals(segment.toString())) {
                throw outsideRepository();
            }
        }

        Path normalizedRelative = relative.normalize();
        if (normalizedRelative.toString().isEmpty()
                || GIT_METADATA_DIRECTORY.equalsIgnoreCase(
                        normalizedRelative.getName(0).toString())) {
            throw outsideRepository();
        }

        Path target = repository.resolve(normalizedRelative).normalize();
        if (target.equals(repository) || !target.startsWith(repository)) {
            throw outsideRepository();
        }

        try {
            Path realRepository = toRealPathResolvingExistingPrefix(repository);
            Path realParent = toRealPathResolvingExistingPrefix(target.getParent());
            if (!realParent.startsWith(realRepository)) {
                throw outsideRepository();
            }
            Path realParentInRepository = realRepository.relativize(realParent);
            if (GIT_METADATA_DIRECTORY.equalsIgnoreCase(
                    realParentInRepository.getName(0).toString())) {
                throw outsideRepository();
            }
        } catch (IOException e) {
            log.error(UNRESOLVED_PATH_MESSAGE, e);
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, UNRESOLVED_PATH_MESSAGE);
        }

        return target;
    }

    private static Path toRelativePath(String relativePath) {
        if (relativePath == null) {
            throw outsideRepository();
        }
        Path relative;
        try {
            relative = Paths.get(relativePath);
        } catch (InvalidPathException e) {
            throw outsideRepository();
        }
        if (relative.isAbsolute()) {
            throw outsideRepository();
        }
        return relative;
    }

    /**
     * Resolves symbolic links in the longest existing prefix of {@code path} and appends the segments
     * that do not exist yet. A write targets a path that may not exist yet, so the whole path cannot
     * be resolved with {@link Path#toRealPath}.
     */
    private static Path toRealPathResolvingExistingPrefix(Path path) throws IOException {
        Path existing = path;
        while (existing != null && !Files.exists(existing, LinkOption.NOFOLLOW_LINKS)) {
            existing = existing.getParent();
        }
        if (existing == null) {
            return path;
        }
        Path realExisting = existing.toRealPath();
        if (existing.equals(path)) {
            return realExisting;
        }
        return realExisting.resolve(existing.relativize(path)).normalize();
    }

    private static AppsmithPluginException outsideRepository() {
        log.error(OUTSIDE_REPOSITORY_MESSAGE);
        return new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, OUTSIDE_REPOSITORY_MESSAGE);
    }
}
