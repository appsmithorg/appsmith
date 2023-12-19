package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.netty.http.HttpProtocol;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@RequiredArgsConstructor
@ChangeUnit(order = "039", id = "update-api-action-default-http-version")
public class Migration039UpdateAPIDefaultHttpVersion {
    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    /**
     * This migration is to update the default http version to HTTP/1.1 for all API plugins.
     */
    @Execution
    public void updateAPIActionDefaultHttpVersion() {
        Criteria apiActions = where(fieldName(QNewAction.newAction.pluginType)).is("API");
        final Query query = query((new Criteria()).andOperator(apiActions));

        mongoTemplate.find(query, NewAction.class).forEach(action -> {
            if (action.getUnpublishedAction() != null
                    && action.getUnpublishedAction().getActionConfiguration() != null
                    && action.getUnpublishedAction().getActionConfiguration().getHttpVersion() == null) {
                action.getUnpublishedAction().getActionConfiguration().setHttpVersion(HttpProtocol.HTTP11);
            }

            if (action.getPublishedAction() != null
                    && action.getPublishedAction().getActionConfiguration() != null
                    && action.getPublishedAction().getActionConfiguration().getHttpVersion() == null) {
                action.getPublishedAction().getActionConfiguration().setHttpVersion(HttpProtocol.HTTP11);
            }
            mongoTemplate.save(action);
        });
    }
}
