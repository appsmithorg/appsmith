package com.appsmith.server.configurations;

import com.appsmith.external.annotations.DocumentTypeMapper;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.server.configurations.mongo.SoftDeleteMongoRepositoryFactoryBean;
import com.appsmith.server.repositories.BaseRepositoryImpl;
import com.github.cloudyrock.mongock.SpringBootMongock;
import com.github.cloudyrock.mongock.SpringBootMongockBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.convert.DefaultTypeMapper;
import org.springframework.data.convert.SimpleTypeInformationMapper;
import org.springframework.data.convert.TypeInformationMapper;
import org.springframework.data.mongodb.MongoDbFactory;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoTypeMapper;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;

import java.util.Arrays;

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

    @Bean
    public SpringBootMongock mongock(ApplicationContext springContext, MongoTemplate mongoTemplate) {
        return new SpringBootMongockBuilder(
                mongoTemplate,
                getClass().getPackageName().replaceFirst("\\.[^.]+$", ".migrations")
        )
                .setApplicationContext(springContext)
                .setLockQuickConfig()
                .build();
    }

    @Bean
    public MongoTemplate mongoTemplate(MongoDbFactory mongoDbFactory, MappingMongoConverter mappingMongoConverter) {
        return new MongoTemplate(mongoDbFactory, mappingMongoConverter);
    }

    // Custom type mapper here includes our annotation based mapper that is meant to ensure correct mapping for sub-classes
    // We have currently only included the package which contains the DTOs that need this mapping
    @Bean
    public DefaultTypeMapper typeMapper() {
        TypeInformationMapper typeInformationMapper = new DocumentTypeMapper
                .Builder()
                .withBasePackages(new String[]{AuthenticationDTO.class.getPackageName()})
                .build();
        // This is a hack to include the default mapper as a fallback, because Spring seems to override its list instead of appending mappers
        return new DefaultMongoTypeMapper(DefaultMongoTypeMapper.DEFAULT_TYPE_KEY, Arrays.asList(typeInformationMapper, new SimpleTypeInformationMapper()));
    }

    @Bean
    public MappingMongoConverter mappingMongoConverter(DefaultTypeMapper typeMapper, MongoMappingContext context) {
        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        converter.setTypeMapper((MongoTypeMapper) typeMapper);
        return converter;
    }

}
