package com.appsmith.server.configurations;

import com.appsmith.external.annotations.DocumentTypeMapper;
import com.appsmith.server.configurations.mongo.SoftDeleteMongoRepositoryFactoryBean;
import com.appsmith.server.repositories.BaseRepositoryImpl;
import com.github.cloudyrock.mongock.SpringBootMongock;
import com.github.cloudyrock.mongock.SpringBootMongockBuilder;
import com.mongodb.ConnectionString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.convert.TypeInformationMapper;
import org.springframework.data.mongodb.MongoDbFactory;
import org.springframework.data.mongodb.ReactiveMongoDatabaseFactory;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDbFactory;
import org.springframework.data.mongodb.core.SimpleReactiveMongoDatabaseFactory;
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
        repositoryBaseClass = BaseRepositoryImpl.class//,
//        reactiveMongoTemplateRef = "reactiveTemplate"
)
public class MongoConfig {

    @Value("${spring.data.mongodb.uri}")
    private String url;

    @Bean
//    public SpringBootMongock mongock(ApplicationContext springContext) {
    public SpringBootMongock mongock(ApplicationContext springContext, MongoDbFactory mongoDbFactory) {
//        SimpleMongoClientDbFactory mongoDatabaseFactory = new SimpleMongoClientDbFactory(url);
//        TypeInformationMapper typeInformationMapper = new DocumentTypeMapper
//                .Builder()
//                .withBasePackages(new String[] {"com.appsmith.external.models"})
//                .build();
//        MongoTypeMapper typeMapper = new DefaultMongoTypeMapper(DefaultMongoTypeMapper.DEFAULT_TYPE_KEY, Arrays.asList(typeInformationMapper));
//        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, new MongoMappingContext());
//        converter.setTypeMapper(typeMapper);
//        MongoTemplate mongoTemplate = new MongoTemplate(mongoDatabaseFactory, converter);
        return new SpringBootMongockBuilder(
                customMongoTemplate(mongoDbFactory),
                getClass().getPackageName().replaceFirst("\\.[^.]+$", ".migrations")
        )
                .setApplicationContext(springContext)
                .setLockQuickConfig()
                .build();
    }

    @Qualifier("customMongoTemplate")
    @Bean
    public MongoTemplate customMongoTemplate(MongoDbFactory mongoDbFactory) {
        TypeInformationMapper typeInformationMapper = new DocumentTypeMapper
                .Builder()
                .withBasePackages(new String[]{"com.appsmith.external.models"})
                .build();
        MongoTypeMapper typeMapper = new DefaultMongoTypeMapper(DefaultMongoTypeMapper.DEFAULT_TYPE_KEY, Arrays.asList(typeInformationMapper));
        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, new MongoMappingContext());
        converter.setTypeMapper(typeMapper);
        return new MongoTemplate(mongoDbFactory, converter);
    }

//    @Bean
//    public ReactiveMongoTemplate reactiveMongoTemplate(ReactiveMongoDatabaseFactory reactiveMongoDatabaseFactory, MongoMappingContext context) {
//        TypeInformationMapper typeInformationMapper = new DocumentTypeMapper
//                .Builder()
//                .withBasePackages(new String[] {"com.appsmith.external.models", "com.appsmith.server.domains", "com.appsmith.server.dtos"})
//                .build();
//        MongoTypeMapper typeMapper = new DefaultMongoTypeMapper(DefaultMongoTypeMapper.DEFAULT_TYPE_KEY, Arrays.asList(typeInformationMapper));
//        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
//        converter.setTypeMapper(typeMapper);
//        return new ReactiveMongoTemplate(reactiveMongoDatabaseFactory, converter);
//    }

}
