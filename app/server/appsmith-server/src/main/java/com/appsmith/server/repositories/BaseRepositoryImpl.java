package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.blasphemy.DBConnection;
import com.appsmith.server.constants.FieldName;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.mongodb.client.result.UpdateResult;
import jakarta.persistence.EntityManager;
import jakarta.validation.constraints.NotNull;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.support.JpaEntityInformation;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.repository.support.SimpleReactiveMongoRepository;
import org.springframework.data.util.ParsingUtils;
import org.springframework.util.Assert;

import java.io.Serializable;
import java.lang.reflect.Field;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * This repository implementation is the base class that will be used by Spring Data running all the default JPA queries.
 * We override the default implementation {@link SimpleReactiveMongoRepository} to filter out records marked with
 * deleted=true.
 * To enable this base implementation, it MUST be set in the annotation @EnableReactiveMongoRepositories.repositoryBaseClass.
 * This is currently defined in {@link com.appsmith.server.configurations.MongoConfig} (liable to change in the future).
 * <p>
 * An implementation like this can also be used to set default query parameters based on the user's role and permissions
 * to filter out data that they are allowed to see. This is will be implemented with ACL.
 *
 * @param <T>  The domain class that extends {@link BaseDomain}. This is required because we use default fields in
 *             {@link BaseDomain} such as `deleted`
 * @param <ID> The ID field that extends Serializable interface
 *             <p>
 *             In case you are wondering why we have two different repository implementation classes i.e.
 *             BaseRepositoryImpl.java and BaseAppsmithRepositoryCEImpl.java, Arpit's comments on this might be helpful:
 *             ```
 *             BaseRepository is required for running any JPA queries. This doesn’t invoke any ACL permissions. This is used when
 *             we wish to fetch data from the DB without ACL. For eg, Fetching a user by username during login
 *             Usage example:
 *             ActionCollectionRepositoryCE extends BaseRepository to power JPA queries using the ReactiveMongoRepository.
 *             AppsmithRepository is the one that we should use by default (unless the use case demands that we don’t need ACL).
 *             It is implemented by BaseAppsmithRepositoryCEImpl and BaseAppsmithRepositoryImpl. This interface allows us to
 *             define custom Mongo queries by including the delete functionality & ACL permissions.
 *             Usage example:
 *             CustomActionCollectionRepositoryCE extends AppsmithRepository and then implements the functions defined there.
 *             I agree that the naming is a little confusing. Open to hearing better naming suggestions so that we can improve
 *             the understanding of these interfaces.
 *             ```
 *             Ref: https://theappsmith.slack.com/archives/CPQNLFHTN/p1669100205502599?thread_ts=1668753437.497369&cid=CPQNLFHTN
 */
@Slf4j
public class BaseRepositoryImpl<T extends BaseDomain, ID extends Serializable> extends SimpleJpaRepository<T, ID>
        implements BaseRepository<T, ID> {

    protected final @NonNull JpaEntityInformation<T, ID> entityInformation;
    protected final @NonNull EntityManager entityManager;

    protected final DBConnection dbConnection;

    public BaseRepositoryImpl(
            @NonNull JpaEntityInformation<T, ID> entityInformation, @NonNull EntityManager entityManager) {
        super(entityInformation, entityManager);
        this.entityInformation = entityInformation;
        this.entityManager = entityManager;
        this.dbConnection = DBConnection.getInstance();
    }

    private Criteria notDeleted() {
        return new Criteria()
                .andOperator(
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED).exists(false),
                                        where(FieldName.DELETED).is(false)),
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED_AT).exists(false),
                                        where(FieldName.DELETED_AT).is(null)));
    }

    private Criteria getIdCriteria(Object id) {
        return null; /*
                     return where(entityInformation.getIdAttribute()).is(id);*/
    }

    /**
     * When `fieldName` is blank, this method will return the entire object. Otherwise, it will return only the value
     * against the `fieldName` property in the matching object.
     */
    @Override
    public Optional<T> findByIdAndFieldNames(ID id, List<String> fieldNames) {
        return Optional.empty(); /*
        Assert.notNull(id, "The given id must not be null!");
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(notDeleted());

                    if (fieldNames != null && fieldNames.size() > 0) {
                        fieldNames.forEach(fieldName -> {
                            if (!isBlank(fieldName)) {
                                query.fields().include(fieldName);
                            }
                        });
                    }

                    return entityManager
                            .query(entityInformation.getJavaType())
                            .inCollection(entityInformation.getCollectionName())
                            .matching(query)
                            .one();
                });*/
    }

    @Override
    public Optional<T> retrieveById(ID id) {
        return Optional.empty(); /*
        Query query = new Query(getIdCriteria(id));
        query.addCriteria(notDeleted());

        return entityManager
                .query(entityInformation.getJavaType())
                .inCollection(entityInformation.getCollectionName())
                .matching(query)
                .one();*/
    }

    @Override
    public Optional<T> findById(ID id) {
        return Optional.empty(); /*
        return this.findByIdAndFieldNames(id, null);*/
    }

    @Override
    public Optional<T> findByIdAndBranchName(ID id, String branchName) {
        // branchName will be ignored and this method is overridden for the services which are shared across branches
        return this.findById(id);
    }

    @Override
    public List<T> findAll() {
        return Collections.emptyList(); /*
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMapMany(principal -> {
                    Query query = new Query(notDeleted());
                    return entityManager.find(
                            query.cursorBatchSize(10000),
                            entityInformation.getJavaType(),
                            entityInformation.getCollectionName());
                });*/
    }

    @Override
    public List<T> findAll(Example example, Sort sort) {
        return Collections.emptyList(); /*
        Assert.notNull(example, "Sample must not be null!");
        Assert.notNull(sort, "Sort must not be null!");

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMapMany(principal -> {
                    Criteria criteria = new Criteria()
                            .andOperator(
                                    // Older check for deleted
                                    new Criteria()
                                            .orOperator(
                                                    where(FieldName.DELETED).exists(false),
                                                    where(FieldName.DELETED).is(false)),
                                    // New check for deleted
                                    new Criteria()
                                            .orOperator(
                                                    where(FieldName.DELETED_AT).exists(false),
                                                    where(FieldName.DELETED_AT).is(null)),
                                    // Set the criteria as the example
                                    new Criteria().alike(example));

                    Query query = new Query(criteria)
                            .collation(entityInformation.getCollation()) //
                            .with(sort);

                    return entityManager.find(query, example.getProbeType(), entityInformation.getCollectionName());
                });*/
    }

    @Override
    public List<T> findAll(Example example) {

        Assert.notNull(example, "Example must not be null!");
        return findAll(example, Sort.unsorted());
    }

    @Override
    public Optional<T> archive(T entity) {
        return Optional.empty(); /*
        Assert.notNull(entity, "The given entity must not be null!");
        Assert.notNull(entity.getId(), "The given entity's id must not be null!");
        // Entity is already deleted
        if (entity.isDeleted()) {
            return Mono.just(entity);
        }

        entity.setDeletedAt(Instant.now());
        return entityManager.save(entity, entityInformation.getCollectionName());*/
    }

    @Override
    public Optional<Boolean> archiveById(ID id) {
        return Optional.empty(); /*
        Assert.notNull(id, "The given id must not be null!");

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(notDeleted());

                    return entityManager
                            .updateFirst(query, getForArchive(), entityInformation.getJavaType())
                            .map(result -> result.getModifiedCount() > 0 ? true : false);
                });*/
    }

    public Update getForArchive() {
        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return update;
    }

    @Override
    public Optional<Boolean> archiveAllById(Collection<ID> ids) {
        return Optional.empty(); /*
        Assert.notNull(ids, "The given ids must not be null!");
        Assert.notEmpty(ids, "The given list of ids must not be empty!");

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query();
                    query.addCriteria(new Criteria().where(FieldName.ID).in(ids));
                    query.addCriteria(notDeleted());

                    return entityManager
                            .updateMulti(query, getForArchive(), entityInformation.getJavaType())
                            .map(result -> result.getModifiedCount() > 0 ? true : false);
                });*/
    }

    @Override
    public <S extends T> S save(S entity) {
        return entity; /*
                       final boolean isInsert = entity.getId() == null;
                       return super.save(entity).map(savedEntity -> {
                           try {
                               saveToPostgres(savedEntity, isInsert);
                           } catch (SQLException | JsonProcessingException | IllegalAccessException e) {
                               throw new RuntimeException(e);
                           }
                           return savedEntity;
                       });*/
    }

    private <S extends T> void saveToPostgres(S entity, boolean isInsert)
            throws SQLException, JsonProcessingException, IllegalAccessException {
        final String tableName = toSnakeCase(entity.getClass().getSimpleName()) + "s"; // todo: pluralize better
        dbConnection.execute(
                "CREATE TABLE IF NOT EXISTS %s (id SERIAL PRIMARY KEY, oid TEXT UNIQUE)".formatted(tableName));

        final Map<String, Object> valueMap = new LinkedHashMap<>();

        for (Field field : getAllFields(entity)) {
            final String columnName = toSnakeCase(field.getName());
            if ("id".equals(columnName)) {
                valueMap.put("oid", entity.getId());
                continue;
            }
            final Object value = getValue(entity, field);
            dbConnection.execute("ALTER TABLE %s ADD COLUMN IF NOT EXISTS %s %s"
                    .formatted(tableName, columnName, getColumnType(field)));
            valueMap.put(columnName, value);
        }

        if (isInsert) {
            // insert new entry
            final String sql = """
                INSERT INTO %s (%s)
                VALUES (%s)
                """
                    .formatted(
                            tableName,
                            StringUtils.join(valueMap.keySet(), ", "),
                            StringUtils.repeat("?", ", ", valueMap.size()));
            dbConnection.execute(sql, valueMap.values());

        } else {
            // update existing entry
            final String sql =
                    """
                UPDATE %s SET (%s) = (%s)
                WHERE oid = ?
                """
                            .formatted(
                                    tableName,
                                    StringUtils.join(valueMap.keySet(), ", "),
                                    StringUtils.repeat("?", ", ", valueMap.size()));
            final Collection<Object> values = new ArrayList<>(valueMap.values());
            values.add(entity.getId());
            dbConnection.execute(sql, values);
        }
    }

    private String toSnakeCase(String name) {
        return ParsingUtils.reconcatenateCamelCase(name, "_").replaceFirst("^_", "");
    }

    private Object getValue(Object entity, Field field) throws IllegalAccessException {
        field.setAccessible(true);
        return field.get(entity);
    }

    private String getColumnType(Field field) {
        final Class<?> type = field.getType();

        if (type.isEnum()) {
            return "TEXT";
        }

        if (Collection.class.isAssignableFrom(type) || Map.class.isAssignableFrom(type)) {
            return "JSONB";
        }

        // if (ApplicationDetail.class.equals(type)
        // || Application.AppLayout.class.equals(type)
        // || GitApplicationMetadata.class.equals(type)) {
        //     return "JSONB";
        // }

        if (field.getType().getPackageName().startsWith("com.appsmith")) {
            return "JSONB";
        }

        if (Instant.class.equals(type)) {
            return "TIMESTAMP";
        }

        return switch (type.getSimpleName()) {
            case "String" -> "TEXT";
            case "Integer", "int", "long" -> "INTEGER";
            case "Boolean", "boolean" -> "BOOLEAN";
            default -> throw new RuntimeException("Unknown type: " + type.getSimpleName());
        };
    }

    private List<Field> getAllFields(Object entity) {
        final List<Field> fields = new ArrayList<>();
        Class<?> cls = entity.getClass();

        while (cls != null) {
            fields.addAll(List.of(cls.getDeclaredFields()));
            cls = cls.getSuperclass();
        }

        // This is too large a number for Postgres' `integer` type, and we don't really need this in the DB anyway.
        fields.removeIf(f -> "serialVersionUID".equals(f.getName()));

        return fields;
    }
}
