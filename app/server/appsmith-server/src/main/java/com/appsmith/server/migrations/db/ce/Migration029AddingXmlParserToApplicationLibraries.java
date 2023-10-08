package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.constants.ApplicationConstants.XML_PARSER_LIBRARY_UID;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@ChangeUnit(order = "029", id = "add-xmlparser-to-application-jslibs", author = " ")
public class Migration029AddingXmlParserToApplicationLibraries {

    private final MongoTemplate mongoTemplate;
    private static final String UNPUBLISHED_CUSTOM_JS_LIBS =
            fieldName(QApplication.application.unpublishedCustomJSLibs);

    private static final String PUBLISHED_CUSTOM_JS_LIBS = fieldName(QApplication.application.publishedCustomJSLibs);

    public Migration029AddingXmlParserToApplicationLibraries(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addXmlParserEntryToEachApplication() {
        Query applicationQuery = new Query().cursorBatchSize(1024).addCriteria(notDeleted());

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

    public static Criteria notDeleted() {
        return new Criteria()
                .andOperator(
                        // Older check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED).exists(false),
                                        where(FieldName.DELETED).is(false)),
                        // New check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED_AT).exists(false),
                                        where(FieldName.DELETED_AT).is(null)));
    }
}
