package com.appsmith.server;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@ComponentScan({"com.appsmith"})
@EnableScheduling
@EntityScan({"com.appsmith.external.models", "com.appsmith.server.domains", "com.appsmith.server.dtos"})
@EnableTransactionManagement
@Slf4j
@EnableJpaRepositories(basePackages = "com.appsmith.server.repositories")
@EnableR2dbcRepositories(
        basePackages = "com.appsmith.server.r2dbc",
        repositoryBaseClass = BaseR2DBCRepositoryImpl.class)
public class ServerApplication {

    private final ProjectProperties projectProperties;

    public ServerApplication(ProjectProperties projectProperties) {
        this.projectProperties = projectProperties;
        printBuildInfo();
    }

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
