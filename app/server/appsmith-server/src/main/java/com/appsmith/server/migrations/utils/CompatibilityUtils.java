package com.appsmith.server.migrations.utils;

import com.appsmith.external.models.BaseDomain;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

@Slf4j
public class CompatibilityUtils {

    /**
     * This method checks for whether the noCursorTimeout can be applied on this instance of
     * MongoDB, and returns the correct query accordingly.
     *
     * @param mongoTemplate Meant to share the bean with this utility
     * @param originalQuery The original idempotent query to be run without optimization, idempotency is a must
     * @param clazz         The collection this query will be run on
     * @param <T>           The BaseDomain type this collection maps to
     * @return A query that is guaranteed to run on this instance, with or without optimization
     */
    public static <T extends BaseDomain> Query optimizeQueryForNoCursorTimeout(
            MongoTemplate mongoTemplate, Query originalQuery, Class<T> clazz) {
        try {
            log.debug("Check if performant query can be used.");
            Query queryBatchedPerformant = Query.of(originalQuery).noCursorTimeout();
            Query queryBatchedPerformantLimit1 =
                    Query.of(queryBatchedPerformant).limit(1);
            mongoTemplate.stream(queryBatchedPerformantLimit1, clazz)
                    .forEach(domain -> log.debug("{} Id: {}", clazz.getName(), domain.getId()));
            log.debug("Using performant query.");
            return queryBatchedPerformant;

        } catch (UncategorizedMongoDbException uncategorizedMongoDbException) {
            log.debug("Using non-performant query");
        }

        return originalQuery;
    }
}
