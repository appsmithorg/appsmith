package com.appsmith.git.configurations;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Data
@Configuration
public class GitServiceConfig {

    @Value("${appsmith.git.root}")
    private String gitRootPath;

    @Value("gitInitializeRepo/GitConnect-Initialize-Repo-Template")
    private String readmeTemplatePath;

    public Boolean isGitInMemory() {
        if (!StringUtils.hasText(gitRootPath)) {
            return Boolean.FALSE;
        }

        return gitRootPath.startsWith("/dev/shm") || gitRootPath.startsWith("/tmp/shm");
    }
}
