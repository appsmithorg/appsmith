package com.appsmith.server.helpers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;

public class ObjectMapperUtils {
    private final ObjectMapper objectMapper;

    public ObjectMapperUtils(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public <T> T readFromString(String src, Class viewsClass, Class<T> resultClass) throws IOException {
        return objectMapper
                .readerWithView(viewsClass)
                .readValue(src, resultClass);
    }

    public <T> T readFromFile(File file, Class viewsClass, Class<T> resultClass) throws IOException {
        return objectMapper
                .readerWithView(viewsClass)
                .readValue(file, resultClass);
    }

    public String writeAsString(Object src, Class viewsClass) throws JsonProcessingException {
        return objectMapper
                .writerWithView(viewsClass)
                .writeValueAsString(src);
    }
}
