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
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static com.appsmith.server.helpers.ce.bridge.Bridge.notExists;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

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
