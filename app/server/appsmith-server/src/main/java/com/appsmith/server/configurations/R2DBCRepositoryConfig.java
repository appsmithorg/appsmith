package com.appsmith.server.configurations;

import com.appsmith.server.repositories.r2dbc.base.BaseR2DBCRepositoryImpl;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

@Configuration
@EnableR2dbcRepositories(
        basePackages = "com.appsmith.server.repositories.r2dbc",
        repositoryBaseClass = BaseR2DBCRepositoryImpl.class)
public class R2DBCRepositoryConfig {}
