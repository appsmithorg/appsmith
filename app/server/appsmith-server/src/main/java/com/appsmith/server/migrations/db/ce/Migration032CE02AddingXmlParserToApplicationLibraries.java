package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.constants.ApplicationConstants.XML_PARSER_LIBRARY_UID;
import static com.appsmith.server.migrations.MigrationHelperMethods.notDeleted;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 *  Appsmith provides xmlParser v 3.17.5 and few other customJSLibraries by default, xmlParser has been
 *  flagged because it has some vulnerabilities. Appsmith is stopping natively providing support for xmlParser.
 *  This however, would break existing applications which are using xmlParser. In order to prevent this,
 *  applications require to have xmlParser as added library.
 *
 *   and adding its UID in all DTOs
 */
@Slf4j
@ChangeUnit(order = "032-02", id = "add-xml-parser-to-application-jslibs", author = " ")
public class Migration032CE02AddingXmlParserToApplicationLibraries {

    private final MongoTemplate mongoTemplate;
    private static final String XML_PARSER_MIGRATION_FLAG = "hasXmlParserLib";

    public Migration032CE02AddingXmlParserToApplicationLibraries(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addXmlParserEntryToEachApplication() {
        Query applicationQuery = new Query()
                .addCriteria(getMigrationCriteria())
                .cursorBatchSize(1024)
                .addCriteria(notDeleted());

        final Query performanceOptimizedApplicationQuery =
                CompatibilityUtils.optimizeQueryForNoCursorTimeout(mongoTemplate, applicationQuery, Application.class);

        mongoTemplate.stream(performanceOptimizedApplicationQuery, Application.class)
                .forEach(dbApplication -> {
                    dbApplication.setPublishedCustomJSLibs(
                            addXmlParserToJSLibrarySet(dbApplication.getPublishedCustomJSLibs()));
                    dbApplication.setUnpublishedCustomJSLibs(
                            addXmlParserToJSLibrarySet(dbApplication.getUnpublishedCustomJSLibs()));

                    // saves the application back to db with xmlParser UIDs
                    mongoTemplate.save(dbApplication);
                    mongoTemplate.updateFirst(
                            new Query()
                                    .addCriteria(where(fieldName(QApplication.application.id))
                                            .is(dbApplication.getId())),
                            new Update().set(XML_PARSER_MIGRATION_FLAG, true),
                            Application.class);
                });
    }

    private Set<CustomJSLibApplicationDTO> addXmlParserToJSLibrarySet(Set<CustomJSLibApplicationDTO> librarySet) {
        CustomJSLibApplicationDTO xmlParserApplicationDTO = new CustomJSLibApplicationDTO();
        xmlParserApplicationDTO.setUidString(XML_PARSER_LIBRARY_UID);

        if (CollectionUtils.isNullOrEmpty(librarySet)) {
            librarySet = new HashSet<>();
        }

        librarySet.add(xmlParserApplicationDTO);
        return librarySet;
    }

    private static CustomJSLib generateXmlParserJSLibObject() {
        return ApplicationConstants.getDefaultParserCustomJsLibCompatibilityDTO();
    }

    private static Criteria getMigrationCriteria() {
        return where(XML_PARSER_MIGRATION_FLAG).is(false);
    }
}
