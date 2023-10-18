package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.migrations.MigrationHelperMethods;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/**
 * This migration removes the migration flag from application class, after other two migrations of same series have run
 */
@Slf4j
@ChangeUnit(order = "032-03", id = "remove-xml-parser-flag-from-application", author = " ")
public class Migration032CE03RemovingMigrationFlagPostJsLibAddition {

    private final MongoTemplate mongoTemplate;
    private static final String XML_PARSER_MIGRATION_FLAG = "hasXmlParserLib";

    public Migration032CE03RemovingMigrationFlagPostJsLibAddition(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void removeMigrationFlag() {
        mongoTemplate.updateMulti(
                new Query().addCriteria(MigrationHelperMethods.notDeleted()),
                new Update().unset(XML_PARSER_MIGRATION_FLAG),
                Application.class);
    }
}
