package com.appsmith.server.r2dbc.base;

import org.springframework.data.r2dbc.convert.MappingR2dbcConverter;
import org.springframework.data.r2dbc.convert.R2dbcConverter;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.r2dbc.repository.support.SimpleR2dbcRepository;
import org.springframework.data.relational.core.mapping.RelationalMappingContext;
import org.springframework.data.relational.core.mapping.RelationalPersistentEntity;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.data.relational.repository.query.RelationalEntityInformation;
import org.springframework.data.relational.repository.support.MappingRelationalEntityInformation;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class BaseR2DBCRepositoryImpl<T, ID> extends SimpleR2dbcRepository<T, ID> implements BaseR2DBCRepository<T, ID> {

    private final R2dbcEntityTemplate template;
    private final Class<T> domainType;

    public BaseR2DBCRepositoryImpl(R2dbcEntityTemplate template, Class<T> domainType) {
        // Create RelationalEntityInformation via a helper
        super(
                getEntityInformation(domainType, template),
                template, // R2dbcEntityOperations
                template.getConverter() // R2dbcConverter
                );
        this.template = template;
        this.domainType = domainType;
    }

    public BaseR2DBCRepositoryImpl(
        MappingRelationalEntityInformation<T, ID> entityInformation,
        R2dbcEntityTemplate entityOperations,
        MappingR2dbcConverter converter
    ) {
        super(entityInformation, entityOperations, converter);
        this.template = entityOperations;
        this.domainType = entityInformation.getJavaType();
    }

    private static <T, ID> RelationalEntityInformation<T, ID> getEntityInformation(
            Class<T> domainType, R2dbcEntityTemplate template) {

        R2dbcConverter converter = template.getConverter();
        RelationalMappingContext mappingContext = (RelationalMappingContext) converter.getMappingContext();

        @SuppressWarnings("unchecked")
        RelationalPersistentEntity<T> persistentEntity =
                (RelationalPersistentEntity<T>) mappingContext.getRequiredPersistentEntity(domainType);

        // Use the (persistentEntity, tableNameAsString) constructor:
        return new MappingRelationalEntityInformation<>(
                persistentEntity, persistentEntity.getTableName().toString() // <- second param must be a String
                );
    }

    @Override
    public Mono<T> findByIdAndDeletedAtIsNull(ID id) {
        return template.select(domainType)
                .matching(
                        Query.query(Criteria.where("id").is(id).and("deletedAt").isNull()))
                .one();
    }

    @Override
    public Flux<T> findAllAndDeletedAtIsNull() {
        return template.select(domainType)
                .matching(Query.query(Criteria.where("deletedAt").isNull()))
                .all();
    }

    @Override
    public Mono<Boolean> existsByIdAndDeletedAtIsNull(ID id) {
        return findByIdAndDeletedAtIsNull(id).hasElement();
    }
}
