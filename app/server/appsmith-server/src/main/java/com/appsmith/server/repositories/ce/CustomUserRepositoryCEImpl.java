package com.appsmith.server.repositories.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.projections.EmailOnly;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

import static com.appsmith.server.helpers.ce.bridge.Bridge.notExists;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

    private static final String SUPER_USER_SETUP_COLLECTION = "superUserSetupLock";
    private static final String SUPER_USER_SETUP_LOCK_ID = "super-user-setup";

    @Autowired
    private ReactiveMongoOperations reactiveMongoOperations;

    @Override
    public Mono<User> findByEmailAndOrganizationId(String email, String organizationId) {
        return queryBuilder()
                .criteria(Bridge.equal(User.Fields.email, email).equal(User.Fields.organizationId, organizationId))
                .one();
    }

    /**
     * Fetch minimal information from *a* user document in the database, limit to two documents, filter system generated
     * users.
     * If no documents left return true otherwise return false.
     *
     * @return Boolean, indicated where there exists at least one user in the system or not.
     */
    @Override
    public Mono<Boolean> isUsersEmpty() {
        return queryBuilder()
                .criteria(Bridge.or(
                        notExists(User.Fields.isSystemGenerated), Bridge.isFalse(User.Fields.isSystemGenerated)))
                .limit(1)
                .all(IdOnly.class)
                .count()
                .map(count -> count == 0);
    }

    /**
     * Atomically claims the super user creation slot using MongoDB's findAndModify with upsert.
     *
     * This uses a dedicated collection with a fixed _id. The findAndModify operation with upsert=true
     * is atomic at the document level in MongoDB: only the first request to attempt the upsert will
     * succeed (returning null, meaning no prior document existed). All subsequent requests will find
     * the existing document and return it, indicating the slot is already claimed.
     *
     * This works on both standalone MongoDB and replica sets — no transaction support required.
     */
    @Override
    public Mono<Boolean> claimSuperUserCreationSlot() {
        Query query = new Query(Criteria.where("_id").is(SUPER_USER_SETUP_LOCK_ID));
        Update update = new Update()
                .setOnInsert("_id", SUPER_USER_SETUP_LOCK_ID)
                .setOnInsert("status", "CLAIMED")
                .setOnInsert("claimedAt", Instant.now().toString());

        FindAndModifyOptions options =
                FindAndModifyOptions.options().upsert(true).returnNew(false);

        return reactiveMongoOperations
                .findAndModify(query, update, options, Document.class, SUPER_USER_SETUP_COLLECTION)
                .hasElement()
                .map(documentExisted -> !documentExisted)
                .onErrorResume(e -> {
                    if (e instanceof org.springframework.dao.DuplicateKeyException) {
                        return Mono.just(false);
                    }
                    return Mono.error(e);
                });
    }

    @Override
    public Mono<Void> releaseSuperUserCreationSlot() {
        Query query = new Query(Criteria.where("_id").is(SUPER_USER_SETUP_LOCK_ID));
        return reactiveMongoOperations
                .remove(query, SUPER_USER_SETUP_COLLECTION)
                .then();
    }

    @Override
    public Flux<String> getSystemGeneratedUserEmails(String organizationId) {
        return queryBuilder()
                .criteria(Bridge.equal(User.Fields.isSystemGenerated, true)
                        .equal(User.Fields.organizationId, organizationId))
                .all(EmailOnly.class)
                .map(EmailOnly::email);
    }

    @Override
    public Mono<Integer> updateById(String id, UpdateDefinition updateObj) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return queryBuilder().byId(id).updateFirst(updateObj);
    }
}
