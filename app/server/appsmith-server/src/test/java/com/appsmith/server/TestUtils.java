package com.appsmith.server;

import org.mockito.Mockito;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.FormFieldPart;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;

public class TestUtils {

    public static void ensureFileExists(String path) throws IOException {
        final Path envFilePath = Path.of(path);
        if (!Files.exists(envFilePath)) {
            if (!Files.exists(envFilePath.getParent())) {
                Files.createDirectories(envFilePath.getParent());
            }
            Files.createFile(envFilePath);
        }
    }

    public static FormFieldPart makeMockedFieldPart(String value) {
        final FormFieldPart part = mock(FormFieldPart.class);
        Mockito.when(part.content()).thenReturn(Flux.just(DefaultDataBufferFactory.sharedInstance.wrap(value.getBytes())));
        return part;
    }

    public static FilePart makeMockedFilePart(String filename, String contentType) {
        final FilePart part = mock(FilePart.class);
        Mockito.when(part.filename()).thenReturn(filename);
        Mockito.when(part.content()).thenReturn(Flux.just(DefaultDataBufferFactory.sharedInstance.wrap(filename.getBytes())));
        Mockito.when(part.headers()).thenReturn(new HttpHeaders(new LinkedMultiValueMap<>(Map.of(
                "Content-Type", List.of(contentType)
        ))));
        return part;
    }

}
