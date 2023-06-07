/* Copyright 2019-2023 Appsmith */
package com.external.config;

import java.util.Map;

public interface TemplateMethod {

    default void replaceMethodConfigTemplate(
            Map<String, Object> formData, Map<String, String> mappedColumns) {}
}
