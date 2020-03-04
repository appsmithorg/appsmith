package com.appsmith.server.repositories;

import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.domains.User;
import com.querydsl.core.types.Path;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.query.Criteria;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class BaseAppsmithRepositoryImpl {

    public static final Criteria notDeleted() {
        return new Criteria().orOperator(
                where(fieldName(QBaseDomain.baseDomain.deleted)).exists(false),
                where(fieldName(QBaseDomain.baseDomain.deleted)).is(false)
        );
    }

    public static final Criteria userAcl(User user, String permission) {
        log.debug("Going to add userAcl for user: {} and permission: {}", user.getUsername(), permission);

        Criteria userCriteria = Criteria.where("policies")
                .elemMatch(Criteria.where("users").all(user.getUsername())
                        .and("permissions").all(permission)
                );
        log.debug("Got the userCriteria: {}", userCriteria.getCriteriaObject());

        Criteria groupCriteria = Criteria.where("policies")
                .elemMatch(Criteria.where("groups").all(user.getGroupIds())
                        .and("permissions").all(permission));

        log.debug("Got the groupCriteria: {}", groupCriteria.getCriteriaObject());
        return new Criteria().orOperator(userCriteria, groupCriteria);
    }

    public static final String fieldName(Path path) {
        return path != null ? path.getMetadata().getName() : null;
    }
}
