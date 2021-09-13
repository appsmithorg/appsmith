package com.appsmith.git.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class GitServiceConfig {

    @Value("${appsmith.git.root:./container-volumes/git-storage}")
    private String gitRootPath;

    public GitServiceConfig() {};
}
