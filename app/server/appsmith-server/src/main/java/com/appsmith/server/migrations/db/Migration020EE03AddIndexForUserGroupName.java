package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.UserGroup;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "020-ee-03", id = "create-index-for-user-group-name", author = " ")
public class Migration020EE03AddIndexForUserGroupName {
    private final MongoTemplate mongoTemplate;

    public static final String userGroupIndexName = "user_group_index_name";

    public Migration020EE03AddIndexForUserGroupName(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void createNewIndexUserGroupName() {
        dropIndexIfExists(mongoTemplate, UserGroup.class, userGroupIndexName);

        Index indexUserGroupName = makeIndex(UserGroup.Fields.name).named(userGroupIndexName);

        ensureIndexes(mongoTemplate, UserGroup.class, indexUserGroupName);
    }
}
