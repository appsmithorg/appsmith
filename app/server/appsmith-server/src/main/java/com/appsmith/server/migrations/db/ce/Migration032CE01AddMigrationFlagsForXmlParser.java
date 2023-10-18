package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.migrations.MigrationHelperMethods;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/**
 *  Appsmith provides xmlParser v 3.17.5 and few other customJSLibraries by default, xmlParser has been
 *  flagged because it has some vulnerabilities. Appsmith is stopping natively providing support for xmlParser.
 *  This however, would break existing applications which are using xmlParser. In order to prevent this,
 *  applications require to have xmlParser as added library.
 *
 *  This migration takes care of adding a migration flag and adding a document in customJsLib for xml-parser
 */
@Slf4j
@ChangeUnit(order = "032-01", id = "add-xml-parser-flag-in-application", author = " ")
public class Migration032CE01AddMigrationFlagsForXmlParser {
    private final MongoTemplate mongoTemplate;

    private static final String XML_PARSER_MIGRATION_FLAG = "hasXmlParserLib";

    public Migration032CE01AddMigrationFlagsForXmlParser(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addMigrationFlagToApplicationCollection() {
        // Temporary addition of migration flag in Application Collection
        mongoTemplate.updateMulti(
                new Query().addCriteria(MigrationHelperMethods.notDeleted()),
                new Update().set(XML_PARSER_MIGRATION_FLAG, false),
                Application.class);

        // add the xml-parser to customJSLib if it's not already present
        CustomJSLib customJSLib = generateXmlParserJSLibObject();
        try {
            mongoTemplate.save(customJSLib);
        } catch (DuplicateKeyException duplicateKeyException) {
            log.debug(
                    "Addition of xmlParser object in customJSLib failed, because object with similar UID already exists");
        } catch (Exception exception) {
            log.debug("Addition of xmlParser object in customJSLib failed");
        }
    }

    private static CustomJSLib generateXmlParserJSLibObject() {
        return ApplicationConstants.getDefaultParserCustomJsLibCompatibilityDTO();
    }
}
