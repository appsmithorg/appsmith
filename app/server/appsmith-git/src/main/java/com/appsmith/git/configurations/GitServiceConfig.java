package com.appsmith.git.configurations;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import javax.annotation.PostConstruct;

@Data
@Configuration
public class GitServiceConfig {

    @Value("${appsmith.git.root:/data/git-storage}")
    private String gitRootPath;

    @Value("gitInitializeRepo/GitConnect-Initialize-Repo-Template")
    private String readmeTemplatePath;

    @Value("${oauth2.allowed-domains}")
    private String allowedDomains;

    @PostConstruct
    public void init() {
        // Add localhost to allowed domains if not present
        if (!allowedDomains.contains("localhost")) {
            allowedDomains = allowedDomains + ",localhost";
        }
    }
}
