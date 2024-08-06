package com.appsmith.server.configurations;

import com.appsmith.external.annotations.documenttype.DocumentTypeMapper;
import com.appsmith.external.annotations.encryption.EncryptionMongoEventListener;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.server.configurations.mongo.SoftDeleteMongoRepositoryFactoryBean;
import com.appsmith.server.converters.StringToInstantConverter;
import com.appsmith.server.repositories.BaseRepositoryImpl;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.google.common.collect.ImmutableSet;
import com.google.common.reflect.ClassPath;
import com.mongodb.ReadConcern;
import com.mongodb.WriteConcern;
import com.mongodb.reactivestreams.client.MongoClient;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.driver.mongodb.reactive.driver.MongoReactiveDriver;
import io.mongock.runner.springboot.MongockSpringboot;
import io.mongock.runner.springboot.RunnerSpringbootBuilder;
import io.mongock.runner.springboot.base.MongockInitializingBeanRunner;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.bson.conversions.Bson;
import org.springframework.boot.autoconfigure.mongo.MongoProperties;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.convert.DefaultTypeMapper;
import org.springframework.data.convert.SimpleTypeInformationMapper;
import org.springframework.data.convert.TypeInformationMapper;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.ReactiveMongoDatabaseFactory;
import org.springframework.data.mongodb.ReactiveMongoTransactionManager;
import org.springframework.data.mongodb.config.EnableReactiveMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.MongoTypeMapper;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;
import org.springframework.transaction.ReactiveTransactionManager;
import org.springframework.transaction.reactive.TransactionalOperator;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * This configures the JPA Mongo repositories. The default base implementation is defined in {@link BaseRepositoryImpl}.
 * This is required to add default clauses for default JPA queries defined by Spring Data.
 * <p>
 * The factoryBean class is also custom defined in order to add default clauses for soft delete for all custom JPA queries.
 * {@link SoftDeleteMongoRepositoryFactoryBean} for details.
 */
@Slf4j
@Configuration
@EnableReactiveMongoAuditing
@EnableReactiveMongoRepositories(
        repositoryFactoryBeanClass = SoftDeleteMongoRepositoryFactoryBean.class,
        basePackages = "com.appsmith.server.repositories",
        repositoryBaseClass = BaseRepositoryImpl.class)
public class MongoConfig {

    private static final Set<String> FORBIDDEN_IDS = Set.of(
            // List generated during PR development with the following command:
            // git diff release HEAD | awk -F\" '/^-[[:space:]]+@ChangeSet/ {print "\"" $4 "\","}'
            // Any deleted migration in the future, should go into this list.
            "remove-org-name-index",
            "application-deleted-at",
            "hide-rapidapi-plugin",
            "datasource-deleted-at",
            "page-deleted-at",
            "friendly-plugin-names",
            "add-delete-datasource-perm-existing-groups",
            "install-default-plugins-to-all-organizations",
            "ensure-datasource-created-and-updated-at-fields",
            "add-index-for-sequence-name",
            "fix-double-escapes",
            "encrypt-password",
            "execute-action-for-read-action",
            "invite-and-public-permissions",
            "migrate-page-and-actions",
            "new-action-add-index-pageId",
            "ensure-app-icons-and-colors",
            "update-authentication-type",
            "add-isSendSessionEnabled-key-for-datasources",
            "add-app-viewer-invite-policy",
            "update-database-encode-params-toggle",
            "update-postgres-plugin-preparedStatement-config",
            "fix-dynamicBindingPathListForActions",
            "update-database-action-configuration-timeout",
            "change-applayout-type-definition",
            "update-mysql-postgres-mongo-ssl-mode",
            "add-commenting-permissions",
            "create-entry-in-sequence-per-organization-for-datasource",
            "migrate-smartSubstitution-dataType",
            "update-mongo-import-from-srv-field",
            "delete-mongo-datasource-structures",
            "set-mongo-actions-type-to-raw",
            "update-firestore-where-conditions-data",
            "add-application-export-permissions",
            "mongo-form-merge-update-commands",
            "ensure-user-created-and-updated-at-fields",
            "add-and-update-order-for-all-pages",
            "mongo-form-migrate-raw",
            "remove-order-field-from-application- pages",
            "encrypt-certificate",
            "application-git-metadata",
            "update-google-sheet-plugin-smartSubstitution-config",
            "uninstall-mongo-uqi-plugin",
            "migrate-mongo-to-uqi",
            "migrate-mongo-uqi-dynamicBindingPathList",
            "delete-orphan-actions",
            "migrate-old-app-color-to-new-colors",
            "update-s3-permanent-url-toggle-default-value",
            "application-git-metadata-index",
            "set-slug-to-application-and-page",
            "update-list-widget-trigger-paths",
            "update-s3-action-configuration-for-type",
            "fix-ispublic-is-false-for-public-apps",
            "update-js-action-client-side-execution",
            "update-mockdb-endpoint",
            "insert-default-resources",
            "flush-spring-redis-keys",
            "migrate-firestore-to-uqi-2",
            "migrate-firestore-pagination-data",
            "update-mongodb-mockdb-endpoint",
            "create-system-themes",
            "add-limit-field-data-to-mongo-aggregate-cmd",
            "update-mockdb-endpoint-2",
            "migrate-from-RSA-SHA1-to-ECDSA-SHA2-protocol-for-key-generation",
            "create-system-themes-v2",
            "set-firestore-smart-substitution-to-false-for-old-cmds",
            "deprecate-archivedAt-in-action",
            "update-form-data-for-uqi-mode",
            "add-isConfigured-flag-for-all-datasources",
            "set-application-version",
            "delete-orphan-pages",
            "copy-organization-to-workspaces",
            "add-tenant-to-all-workspaces",
            "migrate-permission-in-workspace",
            "migrate-organizationId-to-workspaceId-in-newaction-datasource",
            "add-default-permission-groups",
            "mark-public-apps",
            "mark-workspaces-for-inheritance",
            "inherit-policies-to-every-child-object",
            "make-applications-public",
            "install-graphql-plugin-to-remaining-workspaces",
            "delete-rapid-api-plugin-related-items",
            "remove-preferred-ssl-mode-from-mysql",
            "update-organization-slugs",
            "update-sequence-names-from-organization-to-workspace",
            "migrate-organizationId-to-workspaceId-in-domain-objects",
            "migrate-permission-in-user",
            "migrate-google-sheets-to-uqi",
            "add-tenant-to-all-users-and-flush-redis",
            "fix-deleted-themes-when-git-branch-deleted",
            "migrate-public-apps-single-pg");

    /*
        Changing this froom ApplicationRunner to InitializingBeanRunner
        We are doing so because when one migration failed to run because API call executed before migration on old data
        and made inconsistent for migration, having API calls run on unmigrated data is also a issue.
        Link to documentation: https://docs.mongock.io/v5/runner/springboot/index.html
    */
    @Bean
    public MongockInitializingBeanRunner mongockInitializingBeanRunner(
            ApplicationContext springContext, MongoClient mongoClient, MongoProperties mongoProperties) {
        MongoReactiveDriver driver =
                MongoReactiveDriver.withDefaultLock(mongoClient, mongoProperties.getMongoClientDatabase());
        driver.setWriteConcern(WriteConcern.JOURNALED.withJournal(false));
        driver.setReadConcern(ReadConcern.LOCAL);

        final RunnerSpringbootBuilder runnerBuilder = MongockSpringboot.builder()
                .setDriver(driver)
                .addChangeLogsScanPackages(List.of("com.appsmith.server.migrations"))
                .addMigrationScanPackage("com.appsmith.server.migrations.db")
                .setSpringContext(springContext);

        checkForbiddenIds(runnerBuilder);

        return runnerBuilder.buildInitializingBeanRunner();
    }

    @SneakyThrows
    private void checkForbiddenIds(RunnerSpringbootBuilder runnerSpringbootBuilder) {
        final List<String> packages = runnerSpringbootBuilder.getConfig().getMigrationScanPackage();
        for (String pkg : packages) {
            final ImmutableSet<ClassPath.ClassInfo> classes =
                    ClassPath.from(getClass().getClassLoader()).getTopLevelClasses(pkg);
            for (ClassPath.ClassInfo clsInfo : classes) {
                final Class<?> cls = clsInfo.load();
                if (cls.isAnnotationPresent(ChangeLog.class)) {
                    for (final Method method : cls.getDeclaredMethods()) {
                        if (method.isAnnotationPresent(ChangeSet.class)) {
                            final String id =
                                    method.getAnnotation(ChangeSet.class).id();
                            if (FORBIDDEN_IDS.contains(id)) {
                                throw new RuntimeException("Forbidden migration id: " + id);
                            }
                        }
                    }
                } else if (cls.isAnnotationPresent(ChangeUnit.class)) {
                    final String id = cls.getAnnotation(ChangeUnit.class).id();
                    if (FORBIDDEN_IDS.contains(id)) {
                        throw new RuntimeException("Forbidden migration id: " + id);
                    }
                }
            }
        }
    }

    @Bean
    public ReactiveMongoTemplate reactiveMongoTemplate(
            ReactiveMongoDatabaseFactory mongoDbFactory, MappingMongoConverter mappingMongoConverter) {
        ReactiveMongoTemplate mongoTemplate = new ReactiveMongoTemplate(mongoDbFactory, mappingMongoConverter);
        MappingMongoConverter conv = (MappingMongoConverter) mongoTemplate.getConverter();
        // tell mongodb to use the custom converters
        conv.setCustomConversions(mongoCustomConversions());
        conv.afterPropertiesSet();
        return mongoTemplate;
    }

    @Bean
    public MongoTemplate mongoTemplate(
            MongoDatabaseFactory mongoDbFactory, MappingMongoConverter mappingMongoConverter) {
        MongoTemplate mongoTemplate = new MongoTemplate(mongoDbFactory, mappingMongoConverter);
        MappingMongoConverter conv = (MappingMongoConverter) mongoTemplate.getConverter();
        // tell mongodb to use the custom converters
        conv.setCustomConversions(mongoCustomConversions());
        conv.afterPropertiesSet();
        return mongoTemplate;
    }

    // Custom type mapper here includes our annotation based mapper that is meant to ensure correct mapping for
    // sub-classes
    // We have currently only included the package which contains the DTOs that need this mapping
    @Bean
    public DefaultTypeMapper<Bson> typeMapper() {
        TypeInformationMapper typeInformationMapper = new DocumentTypeMapper.Builder()
                .withBasePackages(new String[] {AuthenticationDTO.class.getPackageName()})
                .build();
        // This is a hack to include the default mapper as a fallback, because Spring seems to override its list instead
        // of appending mappers
        return new DefaultMongoTypeMapper(
                DefaultMongoTypeMapper.DEFAULT_TYPE_KEY,
                Arrays.asList(typeInformationMapper, new SimpleTypeInformationMapper()));
    }

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(Collections.singletonList(new StringToInstantConverter()));
    }

    @Bean
    public MappingMongoConverter mappingMongoConverter(
            DefaultTypeMapper<Bson> typeMapper, MongoMappingContext context) {
        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        converter.setTypeMapper((MongoTypeMapper) typeMapper);
        converter.setCustomConversions(mongoCustomConversions());
        converter.setMapKeyDotReplacement("-APPSMITH-DOT-REPLACEMENT-");
        return converter;
    }

    @Bean
    public EncryptionMongoEventListener encryptionMongoEventListener() {
        return new EncryptionMongoEventListener();
    }

    @Bean
    public ReactiveTransactionManager reactiveTransactionManager(ReactiveMongoDatabaseFactory factory) {
        return new ReactiveMongoTransactionManager(factory);
    }

    @Bean
    public TransactionalOperator transactionalOperator(ReactiveTransactionManager transactionManager) {
        return TransactionalOperator.create(transactionManager);
    }
}
