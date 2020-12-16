package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource(value = "classpath:META-INF/maven/com.appsmith/server/pom.properties", ignoreResourceNotFound = true)
@Getter
public class ProjectProperties {

    @Value("${version:}")
    private String version;

}
