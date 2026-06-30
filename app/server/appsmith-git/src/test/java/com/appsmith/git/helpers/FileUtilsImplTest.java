package com.appsmith.git.helpers;

import com.appsmith.external.dtos.ModifiedResources;
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
import org.json.JSONArray;
import org.json.JSONObject;
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
import java.util.Map;
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
     * GHSA-r553-q33m-v7pf: Path traversal via malicious widgetName during Git serialization.
     * A widget with a name containing path traversal sequences (e.g., "../../../../tmp/evil")
     * must be rejected by validatePathIsWithinGitRoot before any file write occurs.
     */
    @Test
    public void saveApplicationRef_pathTraversalInWidgetName_throwsSecurityException_GHSA_r553()
            throws GitAPIException, IOException {

        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(true));

        Files.createDirectories(localTestDirectoryPath);

        ModifiedResources modifiedResources = new ModifiedResources();
        modifiedResources.putResource("pageList", "TestPage");

        String maliciousWidgetName = "../../../../tmp/ghsa-r553-traversal-test";

        JSONObject maliciousWidget = new JSONObject();
        maliciousWidget.put("widgetName", maliciousWidgetName);
        maliciousWidget.put("type", "BUTTON_WIDGET");
        maliciousWidget.put("widgetId", "exploit123");

        JSONObject canvasWidget = new JSONObject();
        canvasWidget.put("widgetName", "Canvas1");
        canvasWidget.put("type", "CANVAS_WIDGET");
        canvasWidget.put("children", new JSONArray().put(maliciousWidget));

        JSONObject mainContainer = new JSONObject();
        mainContainer.put("widgetName", "MainContainer");
        mainContainer.put("type", "CANVAS_WIDGET");
        mainContainer.put("widgetId", "0");
        mainContainer.put("children", new JSONArray().put(canvasWidget));

        ApplicationGitReference appRef = new ApplicationGitReference();
        appRef.setApplication(new Object());
        appRef.setTheme(new Object());
        appRef.setMetadata(new Object());
        appRef.setModifiedResources(modifiedResources);

        Map<String, Object> pages = new HashMap<>();
        pages.put("TestPage", new Object());
        appRef.setPages(pages);

        Map<String, String> pageDsl = new HashMap<>();
        pageDsl.put("TestPage", mainContainer.toString());
        appRef.setPageDsl(pageDsl);

        appRef.setActions(new HashMap<>());
        appRef.setActionCollections(new HashMap<>());
        appRef.setDatasources(new HashMap<>());
        appRef.setJsLibraries(new HashMap<>());

        Assertions.assertThrows(RuntimeException.class, () -> {
            fileUtils
                    .saveApplicationToGitRepo(Path.of(""), appRef, "branch", false)
                    .block();
        });

        Assertions.assertFalse(
                Files.exists(Path.of("/tmp/ghsa-r553-traversal-test.json")),
                "Path traversal: file was created outside git root");
    }

    /**
     * GHSA-r553-q33m-v7pf: Verify that legitimate widget names still serialize correctly.
     */
    @Test
    public void saveApplicationRef_legitimateWidgetName_doesNotThrow_GHSA_r553() throws GitAPIException, IOException {

        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(true));

        Files.createDirectories(localTestDirectoryPath);

        ModifiedResources modifiedResources = new ModifiedResources();
        modifiedResources.putResource("pageList", "TestPage");

        JSONObject safeWidget = new JSONObject();
        safeWidget.put("widgetName", "Button1");
        safeWidget.put("type", "BUTTON_WIDGET");
        safeWidget.put("widgetId", "safe123");

        JSONObject canvasWidget = new JSONObject();
        canvasWidget.put("widgetName", "Canvas1");
        canvasWidget.put("type", "CANVAS_WIDGET");
        canvasWidget.put("children", new JSONArray().put(safeWidget));

        JSONObject mainContainer = new JSONObject();
        mainContainer.put("widgetName", "MainContainer");
        mainContainer.put("type", "CANVAS_WIDGET");
        mainContainer.put("widgetId", "0");
        mainContainer.put("children", new JSONArray().put(canvasWidget));

        ApplicationGitReference appRef = new ApplicationGitReference();
        appRef.setApplication(new Object());
        appRef.setTheme(new Object());
        appRef.setMetadata(new Object());
        appRef.setModifiedResources(modifiedResources);

        Map<String, Object> pages = new HashMap<>();
        pages.put("TestPage", new Object());
        appRef.setPages(pages);

        Map<String, String> pageDsl = new HashMap<>();
        pageDsl.put("TestPage", mainContainer.toString());
        appRef.setPageDsl(pageDsl);

        appRef.setActions(new HashMap<>());
        appRef.setActionCollections(new HashMap<>());
        appRef.setDatasources(new HashMap<>());
        appRef.setJsLibraries(new HashMap<>());

        Assertions.assertDoesNotThrow(() -> {
            fileUtils
                    .saveApplicationToGitRepo(Path.of(""), appRef, "branch", false)
                    .block();
        });

        Path widgetFile = localTestDirectoryPath
                .resolve(PAGE_DIRECTORY)
                .resolve("TestPage")
                .resolve("widgets")
                .resolve("Button1.json");
        Assertions.assertTrue(Files.exists(widgetFile), "Legitimate widget file should exist");
    }

    /**
     * GHSA-fqwc-g9wm-5895: Symlink path traversal in Git import.
     * A file inside the git root whose lexical path is contained in the git root, but which is a
     * symbolic link pointing OUTSIDE the git root, must be rejected by validatePathIsWithinGitRoot.
     * The lexical Path.normalize() guard does NOT resolve symlinks, so before the fix the read
     * follows the symlink and leaks the target file's content. After the fix the real-path
     * containment check detects the escape and throws.
     */
    @Test
    public void reconstructMetadata_symlinkEscapesGitRoot_throwsSecurityException_GHSA_fqwc() throws IOException {
        // A "secret" file located OUTSIDE the git root.
        Path externalDir = Files.createTempDirectory("ghsa-fqwc-external");
        try {
            Path secretFile = externalDir.resolve("secret.json");
            Files.writeString(secretFile, "{\"fileFormatVersion\": 99, \"leaked\": \"top-secret\"}");

            // Set up a repo directory inside the git root, then replace metadata.json with a symlink
            // pointing to the external secret. The symlink's own path is lexically inside the git root.
            Path repoSuffix = Path.of("workspace-symlink", "app", "repo");
            Path fullRepoPath = localTestDirectoryPath.resolve(repoSuffix);
            Files.createDirectories(fullRepoPath);
            Path metadataPath = fullRepoPath.resolve("metadata.json");
            Files.createSymbolicLink(metadataPath, secretFile);

            // Sanity: the symlink lexically resolves inside the git root (this is what fools the
            // old lexical guard), but its real target is outside.
            Assertions.assertTrue(Files.isSymbolicLink(metadataPath));

            Assertions.assertThrows(RuntimeException.class, () -> {
                fileUtils.reconstructMetadataFromGitRepository(repoSuffix).block();
            });
        } finally {
            FileUtils.deleteDirectory(externalDir.toFile());
        }
    }

    /**
     * GHSA-fqwc-g9wm-5895: A legitimate (non-symlink) file inside the git root must still be readable.
     * Regression guard ensuring the symlink-aware check does not break normal reads.
     */
    @Test
    public void reconstructMetadata_regularFileWithinGitRoot_doesNotThrow_GHSA_fqwc() throws IOException {
        Path repoSuffix = Path.of("workspace-regular", "app", "repo");
        Path fullRepoPath = localTestDirectoryPath.resolve(repoSuffix);
        Files.createDirectories(fullRepoPath);
        Files.writeString(fullRepoPath.resolve("metadata.json"), "{\"fileFormatVersion\": 5}");

        Object result =
                fileUtils.reconstructMetadataFromGitRepository(repoSuffix).block();
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
