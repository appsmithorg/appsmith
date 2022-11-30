package com.appsmith.git.configurations;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
public class GitServiceConfig {

    // TODO: revert it
    @Value("${appsmith.git.root:~/data/git-storage}")
    private String gitRootPath;

    @Value("gitInitializeRepo/GitConnect-Initialize-Repo-Template")
    private String readmeTemplatePath;

}
