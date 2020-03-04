package com.appsmith.server.repositories;

import com.querydsl.core.types.Path;

public class BaseAppsmithRepositoryImpl {

    public static final String fieldName(Path path) {
        return path != null ? path.getMetadata().getName() : null;
    }
}
