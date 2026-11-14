package com.appsmith.git.files;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.files.operations.FileOperationsImpl;
import com.appsmith.git.handler.FSGitHandlerImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Git serialization writes and deletes files only inside the repository directory of the artifact
 * that is serialized.
 */
class RepositoryFileOperationsStayWithinRepositoryTest {

    private static final String OUTSIDE_REPOSITORY_MESSAGE =
            "SECURITY: Refused a Git file operation on a path outside the repository directory";

    private static final String OTHER_REPOSITORY_CONTENT = "content of the other repository";

    @TempDir
    Path gitRoot;

    private FileUtilsImpl fileUtils;
    private Path repository;
    private Path otherRepository;

    @BeforeEach
    void setUp() throws IOException {
        FSGitHandler fsGitHandler = Mockito.mock(FSGitHandlerImpl.class);
        GitServiceConfig gitServiceConfig = new GitServiceConfig();
        gitServiceConfig.setGitRootPath(gitRoot.toString());
        FileOperations fileOperations = new FileOperationsImpl(null, ObservationHelper.NOOP);
        fileUtils = new FileUtilsImpl(
                gitServiceConfig, fsGitHandler, fileOperations, ObservationHelper.NOOP, new ObjectMapper());

        repository = Files.createDirectories(gitRoot.resolve(Path.of("workspace1", "application1", "repository1")));
        otherRepository =
                Files.createDirectories(gitRoot.resolve(Path.of("workspace2", "application2", "repository2")));
    }

    @Test
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectWrite_when_resourcePathLeavesRepository() throws IOException {
        // Given
        Path otherRepositoryFile = otherRepository.resolve("theme.json");
        Files.writeString(otherRepositoryFile, OTHER_REPOSITORY_CONTENT);
        GitResourceMap resourcesFromDB = resourceMapWith(pathRelativeToRepository(otherRepositoryFile));

        // When
        ThrowingCallable operation =
                () -> fileUtils.updateEntitiesInRepo(resourcesFromDB, repository, new GitResourceMap());

        // Then
        assertThatThrownBy(operation)
                .isInstanceOf(AppsmithPluginException.class)
                .hasMessage(OUTSIDE_REPOSITORY_MESSAGE);
        assertThat(otherRepositoryFile).hasContent(OTHER_REPOSITORY_CONTENT);
    }

    @Test
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectFallbackWrite_when_resourcePathLeavesRepository() throws IOException {
        // Given
        Path otherRepositoryFile = otherRepository.resolve("theme.json");
        Files.writeString(otherRepositoryFile, OTHER_REPOSITORY_CONTENT);
        GitResourceMap resourcesFromDB = resourceMapWith(pathRelativeToRepository(otherRepositoryFile));

        // When
        ThrowingCallable operation = () -> fileUtils.updateEntitiesInRepoFallback(resourcesFromDB, repository);

        // Then
        assertThatThrownBy(operation)
                .isInstanceOf(AppsmithPluginException.class)
                .hasMessage(OUTSIDE_REPOSITORY_MESSAGE);
        assertThat(otherRepositoryFile).hasContent(OTHER_REPOSITORY_CONTENT);
    }

    @Test
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_writeNoResource_when_oneResourcePathLeavesRepository() {
        // Given
        GitResourceMap resourcesFromDB = resourceMapWith(
                pathRelativeToRepository(otherRepository.resolve("new-file.json")), "pages/Page1/Page1.json");

        // When
        ThrowingCallable operation =
                () -> fileUtils.updateEntitiesInRepo(resourcesFromDB, repository, new GitResourceMap());

        // Then
        assertThatThrownBy(operation)
                .isInstanceOf(AppsmithPluginException.class)
                .hasMessage(OUTSIDE_REPOSITORY_MESSAGE);
        assertThat(otherRepository.resolve("new-file.json")).doesNotExist();
        assertThat(repository.resolve("pages")).doesNotExist();
    }

    @Test
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectDelete_when_existingFilePathLeavesRepository() throws IOException {
        // Given
        Path otherRepositoryFile = otherRepository.resolve("theme.json");
        Files.writeString(otherRepositoryFile, OTHER_REPOSITORY_CONTENT);
        GitResourceMap resourcesFromFS = resourceMapWith(pathRelativeToRepository(otherRepositoryFile));

        // When
        ThrowingCallable operation =
                () -> fileUtils.updateEntitiesInRepo(new GitResourceMap(), repository, resourcesFromFS);

        // Then
        assertThatThrownBy(operation)
                .isInstanceOf(AppsmithPluginException.class)
                .hasMessage(OUTSIDE_REPOSITORY_MESSAGE);
        assertThat(otherRepositoryFile).hasContent(OTHER_REPOSITORY_CONTENT);
    }

    @Test
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectWrite_when_resourcePathTargetsGitMetadataDirectory() throws IOException {
        // Given
        Path gitMetadataDirectory = Files.createDirectories(repository.resolve(".git"));
        GitResourceMap resourcesFromDB = resourceMapWith(".git/resource.json");

        // When
        ThrowingCallable operation =
                () -> fileUtils.updateEntitiesInRepo(resourcesFromDB, repository, new GitResourceMap());

        // Then
        assertThatThrownBy(operation)
                .isInstanceOf(AppsmithPluginException.class)
                .hasMessage(OUTSIDE_REPOSITORY_MESSAGE);
        assertThat(gitMetadataDirectory).isEmptyDirectory();
    }

    @Test
    @DisplayName("GHSA-x4j8-9c4j-73r7")
    void should_rejectWrite_when_symbolicLinkInRepositoryLeavesRepository() throws IOException {
        // Given
        Path otherRepositoryPages = Files.createDirectories(otherRepository.resolve("pages"));
        Files.createSymbolicLink(repository.resolve("pages"), otherRepositoryPages);
        GitResourceMap resourcesFromDB = resourceMapWith("pages/Page1/Page1.json");

        // When
        ThrowingCallable operation =
                () -> fileUtils.updateEntitiesInRepo(resourcesFromDB, repository, new GitResourceMap());

        // Then
        assertThatThrownBy(operation)
                .isInstanceOf(AppsmithPluginException.class)
                .hasMessage(OUTSIDE_REPOSITORY_MESSAGE);
        assertThat(otherRepositoryPages).isEmptyDirectory();
    }

    @Test
    void should_writeAndDeleteResources_when_pathsStayInRepository() throws IOException {
        // Given
        Path staleFile = repository.resolve("pages/Removed Page/Removed Page.json");
        Files.createDirectories(staleFile.getParent());
        Files.writeString(staleFile, "{}");
        GitResourceMap resourcesFromFS = resourceMapWith("pages/Removed Page/Removed Page.json");
        GitResourceMap resourcesFromDB =
                resourceMapWith("pages/Sales.2024 Übersicht/Sales.2024 Übersicht.json", "theme.json");

        // When
        fileUtils.updateEntitiesInRepo(resourcesFromDB, repository, resourcesFromFS);

        // Then
        assertThat(repository.resolve("pages/Sales.2024 Übersicht/Sales.2024 Übersicht.json"))
                .isRegularFile();
        assertThat(repository.resolve("theme.json")).isRegularFile();
        assertThat(staleFile).doesNotExist();
    }

    @Test
    void should_writeResourcesInFallback_when_pathsStayInRepository() throws IOException {
        // Given
        GitResourceMap resourcesFromDB = resourceMapWith("pages/Page1/Page1.json", "theme.json");

        // When
        fileUtils.updateEntitiesInRepoFallback(resourcesFromDB, repository);

        // Then
        assertThat(repository.resolve("pages/Page1/Page1.json")).isRegularFile();
        assertThat(repository.resolve("theme.json")).isRegularFile();
    }

    private String pathRelativeToRepository(Path target) {
        return repository.relativize(target).toString();
    }

    private static GitResourceMap resourceMapWith(String... filePaths) {
        GitResourceMap gitResourceMap = new GitResourceMap();
        for (String filePath : filePaths) {
            GitResourceIdentity identity = new GitResourceIdentity(GitResourceType.QUERY_DATA, filePath, filePath);
            gitResourceMap.getGitResourceMap().put(identity, "serialized resource");
        }
        return gitResourceMap;
    }
}
