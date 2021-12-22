package com.appsmith.git.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class GitServiceConfig {

    @Value("${appsmith.git.root:/data/git-storage}")
    private String gitRootPath;

    @Value("gitInitializeRepo/GitConnect-Initialize-Repo-Template")
    private String readmeTemplatePath;

}
