package com.appsmith.git.helpers;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.files.FileUtilsImpl;
import com.appsmith.git.files.operations.FileOperationsImpl;
import com.appsmith.git.service.GitExecutorImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.git.constants.GitDirectories.ACTION_COLLECTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.ACTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;

public class FileUtilsImplTest {

    private FileUtilsImpl fileUtils;
    private FSGitHandler fsGitHandler;
    private GitExecutorImpl gitExecutor;

    private static final String localTestDirectory = "localTestDirectory";
    private static final Path localTestDirectoryPath = Path.of(localTestDirectory);

    @BeforeEach
    public void setUp() {
        gitExecutor = Mockito.mock(GitExecutorImpl.class);
        GitServiceConfig gitServiceConfig = new GitServiceConfig();
        gitServiceConfig.setGitRootPath(localTestDirectoryPath.toString());
        FileOperations fileOperations = new FileOperationsImpl(null, ObservationHelper.NOOP);
        fileUtils = new FileUtilsImpl(
                gitServiceConfig,
                fsGitHandler,
                gitExecutor,
                fileOperations,
                ObservationHelper.NOOP,
                new ObjectMapper());
    }

    @AfterEach
    public void tearDown() {
        this.deleteLocalTestDirectoryPath();
    }

    @Test
    public void saveApplicationRef_removeActionAndActionCollectionDirectoryCreatedInV1FileFormat_success()
            throws GitAPIException, IOException {
        Path actionDirectoryPath = localTestDirectoryPath.resolve(ACTION_DIRECTORY);
        Path actionCollectionDirectoryPath = localTestDirectoryPath.resolve(ACTION_COLLECTION_DIRECTORY);
        Files.createDirectories(actionDirectoryPath);
        Files.createDirectories(actionCollectionDirectoryPath);

        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(true));

        ApplicationGitReference applicationGitReference = new ApplicationGitReference();
        applicationGitReference.setApplication(new Object());
        applicationGitReference.setTheme(new Object());
        applicationGitReference.setMetadata(new Object());
        applicationGitReference.setPages(new HashMap<>());
        applicationGitReference.setActions(new HashMap<>());
        applicationGitReference.setActionCollections(new HashMap<>());
        applicationGitReference.setDatasources(new HashMap<>());
        applicationGitReference.setJsLibraries(new HashMap<>());
        fileUtils
                .saveApplicationToGitRepo(Path.of(""), applicationGitReference, "branch", false)
                .block();

        Assertions.assertFalse(actionDirectoryPath.toFile().exists());
        Assertions.assertFalse(actionCollectionDirectoryPath.toFile().exists());
    }

    @Test
    public void testScanAndDeleteDirectoryForDeletedResources() {
        Path pageDirectoryPath = localTestDirectoryPath.resolve(PAGE_DIRECTORY);

        // Create random page directories in the file system
        Set<String> directorySet =
                Set.of("Uneisean", "Keladia", "Lothemas", "Edaemwen", "Qilabwyn", "Dreralle", "Wendadia", "Lareibeth");

        directorySet.forEach(directory -> {
            try {
                Files.createDirectories(pageDirectoryPath.resolve(directory));
            } catch (IOException e) {
                Assertions.fail("Error while creating directory");
            }
        });

        // Create a valid set of directory from the directorySet so that those directories will be retained after
        // scan and delete operation. Every directory except this will be deleted.
        Set<String> validDirectorySet = directorySet.stream().limit(5).collect(Collectors.toUnmodifiableSet());
        // Set<String> validDirectorySet = ImmutableSet.copyOf(Iterables.limit(directorySet, 5));

        this.fileUtils.scanAndDeleteDirectoryForDeletedResources(validDirectorySet, pageDirectoryPath);
        try (Stream<Path> paths = Files.walk(pageDirectoryPath, 1)) {
            Set<String> validFSDirectorySet = paths.filter(
                            path -> Files.isDirectory(path) && !path.equals(pageDirectoryPath))
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .collect(Collectors.toSet());
            Assertions.assertEquals(validDirectorySet, validFSDirectorySet);
        } catch (IOException e) {
            Assertions.fail("Error while scanning directory");
        }
    }

    @Test
    public void testScanAndDeleteFileForDeletedResources() {
        Path actionDirectoryPath = localTestDirectoryPath.resolve(ACTION_DIRECTORY);

        // Create random action files in the file system
        Set<String> actionsSet = Set.of(
                "uneisean.json",
                "keladia.json",
                "lothemas.json",
                "edaemwen.json",
                "qilabwyn.json",
                "dreralle.json",
                "wendadia.json",
                "lareibeth.json");

        try {
            Files.createDirectories(actionDirectoryPath);
            actionsSet.forEach(actionFile -> {
                try {
                    Path actionFilePath = actionDirectoryPath.resolve(actionFile);
                    if (!Files.exists(actionFilePath)) {
                        Files.createFile(actionDirectoryPath.resolve(actionFile));
                    }
                } catch (IOException e) {
                    Assertions.fail("Error while creating files");
                }
            });
        } catch (IOException e) {
            Assertions.fail("Error while creating directory");
        }

        // Create a valid list of actions from the actionsList so that those files will be retained after
        // scan and delete operation. Every file except this will be deleted.
        // Set<String> validActionsSet = ImmutableSet.copyOf(Iterables.limit(actionsSet, 5));
        Set<String> validActionsSet = actionsSet.stream().limit(5).collect(Collectors.toUnmodifiableSet());

        this.fileUtils.scanAndDeleteFileForDeletedResources(validActionsSet, actionDirectoryPath);
        try (Stream<Path> paths = Files.walk(actionDirectoryPath)) {
            Set<String> validFSFilesSet = paths.filter(path -> Files.isRegularFile(path))
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .collect(Collectors.toSet());
            Assertions.assertEquals(validActionsSet, validFSFilesSet);
        } catch (IOException e) {
            Assertions.fail("Error while scanning directory");
        }
    }

    /**
     * GHSA-m4hv-9p7g-56vm: Path traversal in file read operations.
     * readFile/readFiles/readFileAsString must reject paths that escape the git root.
     */
    @Test
    public void reconstructMetadata_pathTraversalInRepoSuffix_throwsSecurityException() {
        // Craft a repoSuffix that traverses above the git root directory
        Path maliciousRepoSuffix = Path.of("workspace", "app", "..", "..", "..", "..", "etc");

        // The internal readFile call should detect the path escapes gitRoot and throw.
        // Before the fix, this would silently attempt to read /etc/metadata.json and return null.
        Assertions.assertThrows(RuntimeException.class, () -> {
            fileUtils.reconstructMetadataFromGitRepository(maliciousRepoSuffix).block();
        });
    }

    /**
     * GHSA-m4hv-9p7g-56vm: Verify that valid paths within git root still work.
     */
    @Test
    public void reconstructMetadata_validPathWithinGitRoot_doesNotThrowSecurityException() throws IOException {
        Path validRepoSuffix = Path.of("workspace1", "app1", "repo1");
        Path fullRepoPath = localTestDirectoryPath.resolve(validRepoSuffix);
        Files.createDirectories(fullRepoPath);
        Files.writeString(fullRepoPath.resolve("metadata.json"), "{\"fileFormatVersion\": 5}");

        // Should NOT throw — the path is within the git root
        Object result =
                fileUtils.reconstructMetadataFromGitRepository(validRepoSuffix).block();
        Assertions.assertNotNull(result);
    }

    /**
     * This will delete localTestDirectory and its contents after the test is executed.
     */
    private void deleteLocalTestDirectoryPath() {
        if (localTestDirectoryPath.toFile().exists()) {
            try {
                FileUtils.deleteDirectory(localTestDirectoryPath.toFile());
            } catch (IOException e) {

            }
        }
    }
}
