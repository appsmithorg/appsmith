package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.helpers.CollectionUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "036", id = "add-recently-used-entities-for-user")
public class Migration036AddRecentlyUsedEntitiesForUserData {

    private final MongoTemplate mongoTemplate;

    public Migration036AddRecentlyUsedEntitiesForUserData(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addRecentlyUsedEntitiesForUserData() {

        final Query userDataQuery =
                query(where(fieldName(QUserData.userData.deleted)).ne(true));

        // We are not migrating the applicationIds, to avoid long-running migration. Also, as user starts using the
        // instance these fields should auto-populate.
        userDataQuery.fields().include(fieldName(QUserData.userData.recentlyUsedWorkspaceIds));

        List<UserData> userDataList = mongoTemplate.find(userDataQuery, UserData.class);
        for (UserData userData : userDataList) {
            final Update update = new Update();
            if (CollectionUtils.isNullOrEmpty(userData.getRecentlyUsedWorkspaceIds())) {
                continue;
            }
            List<RecentlyUsedEntityDTO> recentlyUsedEntityDTOS = new ArrayList<>();
            for (String workspaceId : userData.getRecentlyUsedWorkspaceIds()) {
                RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
                recentlyUsedEntityDTO.setWorkspaceId(workspaceId);
                recentlyUsedEntityDTOS.add(recentlyUsedEntityDTO);
            }
            update.set(fieldName(QUserData.userData.recentlyUsedEntityIds), recentlyUsedEntityDTOS);
            mongoTemplate.updateFirst(
                    query(where(fieldName(QUserData.userData.id)).is(userData.getId())), update, UserData.class);
        }
    }
}
