package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static com.appsmith.server.constants.ApplicationConstants.XML_PARSER_LIBRARY_UID;
import static com.appsmith.server.migrations.MigrationHelperMethods.notDeleted;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

/**
 *  Appsmith provides xmlParser v 3.17.5 and few other customJSLibraries by default, xmlParser has been
 *  flagged because it has some vulnerabilities. Appsmith is stopping natively providing support for xmlParser.
 *  This however, would break existing applications which are using xmlParser. In order to prevent this,
 *  applications require to have xmlParser as added library.
 *
 *  This migration takes care of adding a document in customJsLib for xml-parser and adding corresponding entry
 *  in application collection
 *
 */
@Slf4j
@ChangeUnit(order = "032", id = "add-xml-parser-to-application-jslibs", author = " ")
public class Migration032AddingXmlParserToApplicationLibraries {

    private final MongoTemplate mongoTemplate;
    private static final String UNPUBLISHED_CUSTOM_JS_LIBS =
            fieldName(QApplication.application.unpublishedCustomJSLibs);
    private static final String PUBLISHED_CUSTOM_JS_LIBS = fieldName(QApplication.application.publishedCustomJSLibs);

    public Migration032AddingXmlParserToApplicationLibraries(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addXmlParserEntryToEachApplication() {
        // add the xml-parser to customJSLib if it's not already present
        CustomJSLib customJSLib = generateXmlParserJSLibObject();
        try {
            mongoTemplate.save(customJSLib);
        } catch (DuplicateKeyException duplicateKeyException) {
            log.debug(
                    "Addition of xmlParser object in customJSLib failed, because object with similar UID already exists");
        } catch (Exception exception) {
            throw new AppsmithException(
                    AppsmithError.MIGRATION_FAILED,
                    "Migration032AddingXmlParserToApplicationLibraries",
                    exception.getMessage(),
                    "Unable to insert xml parser library in CustomJSLib collection");
        }

        // add uid entry in all these custom js libs
        Update pushXmlParserUpdate = new Update()
                .addToSet(PUBLISHED_CUSTOM_JS_LIBS, getXmlParserCustomJSLibApplicationDTO())
                .addToSet(UNPUBLISHED_CUSTOM_JS_LIBS, getXmlParserCustomJSLibApplicationDTO());

        log.debug("Going to add Xml Parser uid in all application DTOs");
        mongoTemplate.updateMulti(
                new Query().addCriteria(getMigrationCriteria()), pushXmlParserUpdate, Application.class);
    }

    private CustomJSLibContextDTO getXmlParserCustomJSLibApplicationDTO() {
        CustomJSLibContextDTO xmlParserApplicationDTO = new CustomJSLibContextDTO();
        xmlParserApplicationDTO.setUidString(XML_PARSER_LIBRARY_UID);
        return xmlParserApplicationDTO;
    }

    private static CustomJSLib generateXmlParserJSLibObject() {
        return ApplicationConstants.getDefaultParserCustomJsLibCompatibilityDTO();
    }

    private static Criteria getMigrationCriteria() {
        return notDeleted();
    }
}
