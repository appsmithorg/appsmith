package com.appsmith.server;

import com.appsmith.server.configurations.ProjectProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ComponentScan({"com.appsmith"})
@EnableScheduling
@Slf4j
public class ServerApplication {

    private final ProjectProperties projectProperties;

    public ServerApplication(ProjectProperties projectProperties) {
        this.projectProperties = projectProperties;
        printBuildInfo();
    }

    // Unnecessary comment to raise PR
    public static void main(String[] args) {
        new SpringApplicationBuilder(ServerApplication.class)
                .bannerMode(Banner.Mode.OFF)
                .run(args);
    }

    private void printBuildInfo() {
        String version = projectProperties.getVersion();
        String commitId = projectProperties.getCommitSha();
        log.info("Application started with build version {}, and commitSha {}", version, commitId);
    }
}
