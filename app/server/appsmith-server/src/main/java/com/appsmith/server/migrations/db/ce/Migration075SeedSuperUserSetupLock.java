package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Instant;

/**
 * Seeds the superUserSetupLock sentinel for existing instances that were deployed before the
 * race condition fix. If non-system users already exist (meaning the super admin setup has
 * already completed), this migration inserts the sentinel so that the /api/v1/users/super
 * endpoint correctly rejects all future requests.
 *
 * For fresh instances with no non-system users, this migration is a no-op — the sentinel
 * will be claimed by the first legitimate super user signup request.
 */
@Slf4j
@ChangeUnit(order = "075", id = "seed-super-user-setup-lock", author = "")
public class Migration075SeedSuperUserSetupLock {

    private static final String SUPER_USER_SETUP_COLLECTION = "superUserSetupLock";
    private static final String SUPER_USER_SETUP_LOCK_ID = "super-user-setup";

    private final MongoTemplate mongoTemplate;

    public Migration075SeedSuperUserSetupLock(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void seedSuperUserSetupLock() {
        boolean sentinelExists = mongoTemplate.exists(
                new Query(Criteria.where("_id").is(SUPER_USER_SETUP_LOCK_ID)), SUPER_USER_SETUP_COLLECTION);

        if (sentinelExists) {
            log.info("Super user setup sentinel already exists. Skipping.");
            return;
        }

        long nonSystemUserCount = mongoTemplate.count(
                new Query(Criteria.where("isSystemGenerated").ne(true)), "user");

        if (nonSystemUserCount == 0) {
            log.info("No non-system users found. Fresh instance — sentinel will be claimed during first setup.");
            return;
        }

        Document sentinel = new Document()
                .append("_id", SUPER_USER_SETUP_LOCK_ID)
                .append("status", "CLAIMED")
                .append("claimedAt", Instant.now().toString())
                .append("source", "migration-075");

        try {
            mongoTemplate.insert(sentinel, SUPER_USER_SETUP_COLLECTION);
            log.info(
                    "Seeded super user setup sentinel for existing instance with {} non-system user(s).",
                    nonSystemUserCount);
        } catch (DuplicateKeyException e) {
            log.info("Super user setup sentinel was concurrently inserted. Skipping.");
        }
    }
}
