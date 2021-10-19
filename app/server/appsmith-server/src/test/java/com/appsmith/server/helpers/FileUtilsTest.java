package com.appsmith.server.helpers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;


class FileUtilsTest {

    private FileUtils fileUtils;

    @BeforeEach
    public void setUp() {
        fileUtils = new FileUtils();
    }

    @Test
    public void createZip_WhenFileExists_ValidZipCreated() throws IOException {
        // create a zip with sample two files from resources
        InputStream file1 = new ClassPathResource("FileUtilsTest/sample-file1.txt").getInputStream();
        InputStream file2 = new ClassPathResource("FileUtilsTest/sample-file2.txt").getInputStream();

        byte[] zipBytes = fileUtils.createZip(
                new FileUtils.ZipSourceFile(file1, "file_one.txt"),
                new FileUtils.ZipSourceFile(file2, "file_two.txt")
        );

        // unzip and read the contents into a map. Key of the map is file name and value is file contents
        Map<String, String> fileNameAndContentMap = readZipFile(zipBytes);
        // check that map contains the expected values
        assertThat(fileNameAndContentMap.get("file_one.txt")).isEqualTo("Sample file one");
        assertThat(fileNameAndContentMap.get("file_two.txt")).isEqualTo("Sample file two");
    }

    private Map<String, String> readZipFile(byte[] zipBytes) throws IOException {
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(zipBytes);
        ZipInputStream zis = new ZipInputStream(byteArrayInputStream);
        ZipEntry ze = zis.getNextEntry();

        Map<String, String> fileNameAndContentMap = new HashMap<>(2);

        while(ze != null) {
            String fileName = ze.getName();

            ByteArrayOutputStream result = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            for (int length; (length = zis.read(buffer)) != -1; ) {
                result.write(buffer, 0, length);
            }
            // StandardCharsets.UTF_8.name() > JDK 7
            String fileContent = result.toString("UTF-8");
            result.close();
            zis.closeEntry();
            ze = zis.getNextEntry();
            fileNameAndContentMap.put(fileName, fileContent);
        }
        zis.closeEntry();
        zis.close();
        byteArrayInputStream.close();
        return fileNameAndContentMap;
    }
}