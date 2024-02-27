package com.appsmith.server.migrations;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.domains.Config;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Map;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeLog(order = "000")
public class DatabaseChangelog0 {

    /**
     * This migration initializes the correct version of instance schema migrations
     * in the config collection for this Appsmith instance
     * Future migrations that need to handle migrations for schema versions
     * will check the current state and manage the migration accordingly
     */
    @ChangeSet(order = "001", id = "initialize-schema-version", author = "")
    public void initializeSchemaVersion(MongoTemplate mongoTemplate) {

        Config instanceIdConfig =
                mongoTemplate.findOne(query(where(Config.Fields.name).is("instance-id")), Config.class);

        if (instanceIdConfig != null) {
            // If instance id exists, this is an existing instance
            // Instantiate with the first version so that we expect to go through all the migrations
            mongoTemplate.insert(new Config(new JSONObject(Map.of("value", 1)), Appsmith.INSTANCE_SCHEMA_VERSION));
        } else {
            // Is no instance id exists, this is a new instance
            // Instantiate with latest schema version that this Appsmith release shipped with
            mongoTemplate.insert(new Config(
                    new JSONObject(Map.of("value", CommonConfig.LATEST_INSTANCE_SCHEMA_VERSION)),
                    Appsmith.INSTANCE_SCHEMA_VERSION));
        }
    }
}
