package com.appsmith.server.migrations;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.exceptions.UnsupportedMongoDBVersionException;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;
import java.util.Map;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeLog(order = "000")
public class DatabaseChangelog0 {

    public static final int MIN_MAJOR_VERSION = 5;

    @ChangeSet(order = "000", id = "pre-start-checks", author = "", runAlways = true)
    public void preStartChecks(MongoTemplate mongoTemplate) {
        final Document buildInfo = mongoTemplate.executeCommand(new Document("buildInfo", 1));
        final Object versionArrayObj = buildInfo.get("versionArray");
        if (versionArrayObj instanceof List<?> versionArray) {
            final Object majorVersion = versionArray.get(0);
            if (majorVersion instanceof Integer majorVersionInt && majorVersionInt >= MIN_MAJOR_VERSION) {
                return;
            }
        }
        throw new UnsupportedMongoDBVersionException("Appsmith requires MongoDB v5. Please upgrade your MongoDB. " +
                "You are running: '" + buildInfo.get("version") + "'.");
    }

    /**
     * This migration initializes the correct version of instance schema migrations
     * in the config collection for this Appsmith instance
     * Future migrations that need to handle migrations for schema versions
     * will check the current state and manage the migration accordingly
     */
    @ChangeSet(order = "001", id = "initialize-schema-version", author = "")
    public void initializeSchemaVersion(MongoTemplate mongoTemplate) {

        Config instanceIdConfig = mongoTemplate.findOne(
                query(where(fieldName(QConfig.config1.name)).is("instance-id")),
                Config.class);

        if (instanceIdConfig != null) {
            // If instance id exists, this is an existing instance
            // Instantiate with the first version so that we expect to go through all the migrations
            mongoTemplate.insert(new Config(
                    new JSONObject(Map.of("value", 1)),
                    Appsmith.INSTANCE_SCHEMA_VERSION
            ));
        } else {
            // Is no instance id exists, this is a new instance
            // Instantiate with latest schema version that this Appsmith release shipped with
            mongoTemplate.insert(new Config(
                    new JSONObject(Map.of("value", CommonConfig.LATEST_INSTANCE_SCHEMA_VERSION)),
                    Appsmith.INSTANCE_SCHEMA_VERSION
            ));
        }
    }
}
