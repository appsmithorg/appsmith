package com.appsmith.server.helpers;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Component
public class FileUtils {
    public byte [] createZip(ZipSourceFile...srcFiles) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ZipOutputStream zipOut = new ZipOutputStream(baos);

        for (ZipSourceFile zipSourceFile : srcFiles) {
            InputStream fis = zipSourceFile.fileToZip;
            ZipEntry zipEntry = new ZipEntry(zipSourceFile.getNameInZip());
            zipOut.putNextEntry(zipEntry);

            byte[] bytes = new byte[1024];
            int length;
            while ((length = fis.read(bytes)) >= 0) {
                zipOut.write(bytes, 0, length);
            }
            fis.close();
        }

        zipOut.close();
        byte[] byteArray = baos.toByteArray();
        baos.close();
        return byteArray;
    }

    @AllArgsConstructor
    @Getter
    public static class ZipSourceFile {
        private InputStream fileToZip; // file whose content will be zipped
        private String nameInZip; // name of the file that'll be used when unzip
    }
}
