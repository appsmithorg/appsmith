package com.appsmith.git.helpers;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Iterables;
import junit.framework.TestCase;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.ACTION_DIRECTORY;

public class FileUtilsImplTest extends TestCase {
    private FileUtilsImpl fileUtils;
    private GitServiceConfig gitServiceConfig;
    private GitExecutor gitExecutor;

    @BeforeEach
    public void setUp() {
        fileUtils = new FileUtilsImpl(gitServiceConfig, gitExecutor);
    }

    private static final String localTestDirectory = "localTestDirectory";
    private static final Path localTestDirectoryPath = Path.of(localTestDirectory);

    @Test
    public void testScanAndDeleteDirectoryForDeletedResources() {
        Path pageDirectoryPath = localTestDirectoryPath.resolve(PAGE_DIRECTORY);

        // Create random page directories in the file system
        Set<String> directorySet = new HashSet<String>() {
            {
                add("Uneisean");
                add("Keladia");
                add("Lothemas");
                add("Edaemwen");
                add("Qilabwyn");
                add("Dreralle");
                add("Wendadia");
                add("Lareibeth");
            }
        };

        directorySet.forEach(directory -> {
            try {
                Files.createDirectories(pageDirectoryPath.resolve(directory));
            } catch (IOException e) {
                Assertions.fail("Error while creating directory");
            }
        });

        // Create a valid set of directory from the directorySet so that those directories will be retained after
        // scan and delete operation. Every directory except this will be deleted.
        Set<String> validDirectorySet = ImmutableSet.copyOf(Iterables.limit(directorySet, 5));

        this.fileUtils.scanAndDeleteDirectoryForDeletedResources(validDirectorySet, pageDirectoryPath);
        try (Stream<Path> paths = Files.walk(pageDirectoryPath, 1)) {
            Set<String> validFSDirectorySet = paths
                    .filter(path -> Files.isDirectory(path) && !path.equals(pageDirectoryPath))
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .collect(Collectors.toSet());
            Assertions.assertEquals(validDirectorySet, validFSDirectorySet);
        } catch (IOException e) {
            Assertions.fail("Error while scanning directory");
        }

        this.deleteLocalTestDirectoryPath();
    }

    @Test
    public void testScanAndDeleteFileForDeletedResources(){
        Path actionDirectoryPath = localTestDirectoryPath.resolve(ACTION_DIRECTORY);

        // Create random action files in the file system
        Set<String> actionsSet = new HashSet<String>() {
            {
                add("uneisean.json");
                add("keladia.json");
                add("lothemas.json");
                add("edaemwen.json");
                add("qilabwyn.json");
                add("dreralle.json");
                add("wendadia.json");
                add("lareibeth.json");
            }
        };

        try {
            Files.createDirectories(actionDirectoryPath);
            actionsSet.forEach(actionFile -> {
                try{
                    Path actionFilePath = actionDirectoryPath.resolve(actionFile);
                    if(!Files.exists(actionFilePath)) {
                        Files.createFile(actionDirectoryPath.resolve(actionFile));
                    }
                } catch (IOException e){
                    Assertions.fail("Error while creating files");
                }
            });
        } catch (IOException e) {
            Assertions.fail("Error while creating directory");
        }

        // Create a valid list of actions from the actionsList so that those files will be retained after
        // scan and delete operation. Every file except this will be deleted.
        Set<String> validActionsSet = ImmutableSet.copyOf(Iterables.limit(actionsSet, 5));

        this.fileUtils.scanAndDeleteFileForDeletedResources(validActionsSet, actionDirectoryPath);
        try (Stream<Path> paths = Files.walk(actionDirectoryPath)) {
            Set<String> validFSFilesSet = paths
                    .filter(path -> Files.isRegularFile(path))
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .collect(Collectors.toSet());
            Assertions.assertEquals(validActionsSet, validFSFilesSet);
        } catch (IOException e) {
            Assertions.fail("Error while scanning directory");
        }

        this.deleteLocalTestDirectoryPath();
    }

    /**
     * This will delete localTestDirectory and its contents after the test is executed.
     */
    private void deleteLocalTestDirectoryPath(){
        if(localTestDirectoryPath.toFile().exists()) {
            try {
                FileUtils.deleteDirectory(localTestDirectoryPath.toFile());
            } catch (IOException e){
                //log.debug("Unable to delete directory for path {} with message {}", directory, e.getMessage());
            }
        }
    }
}