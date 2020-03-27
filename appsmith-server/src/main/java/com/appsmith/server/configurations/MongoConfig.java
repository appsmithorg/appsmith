package com.appsmith.server.configurations;

import com.appsmith.server.configurations.mongo.SoftDeleteMongoRepositoryFactoryBean;
import com.appsmith.server.migrations.DatabaseChangelog;
import com.appsmith.server.repositories.BaseRepositoryImpl;
import com.github.mongobee.Mongobee;
import com.github.mongobee.exception.MongobeeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;
import org.springframework.util.StringUtils;

import javax.annotation.PostConstruct;

/**
 * This configures the JPA Mongo repositories. The default base implementation is defined in {@link BaseRepositoryImpl}.
 * This is required to add default clauses for default JPA queries defined by Spring Data.
 * <p>
 * The factoryBean class is also custom defined in order to add default clauses for soft delete for all custom JPA queries.
 * {@link SoftDeleteMongoRepositoryFactoryBean} for details.
 */
@Slf4j
@Configuration
@EnableMongoAuditing
@EnableReactiveMongoRepositories(repositoryFactoryBeanClass = SoftDeleteMongoRepositoryFactoryBean.class,
        basePackages = "com.appsmith.server.repositories",
        repositoryBaseClass = BaseRepositoryImpl.class
)
public class MongoConfig {

    @Value("${spring.data.mongodb.uri:}")
    private String mongoDbUri;

    @Value("${spring.data.mongodb.username:}")
    private String mongoDbUsername;

    @Value("${spring.data.mongodb.password:}")
    private String mongoDbPassword;

    @Value("${spring.data.mongodb.host:}:${spring.data.mongodb.port:}/${spring.data.mongodb.database:}")
    private String mongoDbResource;

    private final MongoTemplate mongoTemplate;

    private MongoMappingContext mongoMappingContext;

    private Environment environment;

    public MongoConfig(MongoTemplate mongoTemplate, MongoMappingContext mongoMappingContext, Environment environment) {
        this.mongoTemplate = mongoTemplate;
        this.mongoMappingContext = mongoMappingContext;
        this.environment = environment;
    }

    @PostConstruct
    public void init() {
        if (!environment.acceptsProfiles(Profiles.of("test"))) {
            try {
                runMigrations();
            } catch (MongobeeException e) {
                log.error("Failed running migrations automatically at startup.", e);
            }
        }
    }

    public void runMigrations() throws MongobeeException {
        String uri;

        if (StringUtils.isEmpty(mongoDbUri)) {
            uri = "mongodb://" +
                mongoDbUsername +
                (mongoDbPassword.isEmpty() ? "" : ":") +
                mongoDbPassword +
                (mongoDbUsername.isEmpty() ? "" : "@") +
                mongoDbResource;
        } else {
            uri = mongoDbUri;
        }

        runMigrations(uri);
    }

    public void runMigrations(String uri) throws MongobeeException {
        // Mongobee creates its own connection to MongoDB and (hopefully) closes it when migration execution is done.
        // If there's no new migrations to be applied, no connection is made. However, note that the `autoCreateIndexes`
        // migration method is always run, so a connection is always made.
        // Also, this Mongobee runner cannot be a separate bean, since then the `.execute` will be called automatically.
        // We need to run it manually so we can control it during tests.
        Mongobee runner = new Mongobee(uri);
        runner.setSpringEnvironment(environment);
        runner.setChangeLogsScanPackage(getClass().getPackageName().replaceFirst("\\.[^.]+$", ".migrations"));
        runner.setMongoTemplate(mongoTemplate);

        DatabaseChangelog.mongoMappingContext = mongoMappingContext;

        log.info("Executing MongoDB migrations");
        runner.execute();
    }

}
