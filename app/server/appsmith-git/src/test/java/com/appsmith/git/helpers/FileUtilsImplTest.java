package com.appsmith.git.helpers;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Iterables;
import junit.framework.TestCase;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class FileUtilsImplTest extends TestCase {
    private FileUtilsImpl fileUtils;
    private GitServiceConfig gitServiceConfig;
    private GitExecutor gitExecutor;

    @BeforeEach
    public void setUp() {
        fileUtils = new FileUtilsImpl(gitServiceConfig, gitExecutor);
    }

    private static final String localDirectory = "localTestDirectory";
    private static final Path localDirectoryPath = Path.of(localDirectory);

    @Test
    public void testScanAndDeleteDirectoryForDeletedResources() {
        String pageDirectory = localDirectory + File.separator +"pages";
        Path pageDirectoryPath = Path.of(pageDirectory);

        // Create random page directories in the file system
        Set<String> directoryList = new HashSet<String>() {
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

        directoryList.forEach(directory -> {
            try {
                Files.createDirectories(Path.of(pageDirectory + File.separator + directory));
            } catch (IOException e) {
                Assertions.fail("Error while creating directory");
            }
        });

        // Create a valid list of directory from the directoryList so that those directories will be retained after
        // scan and delete operation. Every directory except this will be deleted.
        Set<String> validDirectoryList = ImmutableSet.copyOf(Iterables.limit(directoryList, 5));

        this.fileUtils.scanAndDeleteDirectoryForDeletedResources(validDirectoryList, pageDirectoryPath);
        try (Stream<Path> paths = Files.walk(pageDirectoryPath, 1)) {
            Set<String> validFSDirectoryList = paths
                    .filter(path -> Files.isDirectory(path) && !path.equals(pageDirectoryPath))
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .collect(Collectors.toSet());
            Assertions.assertEquals(validDirectoryList, validFSDirectoryList);
        } catch (IOException e) {
            Assertions.fail("Error while scanning directory");
        }
    }
}