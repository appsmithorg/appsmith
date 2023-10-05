package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.CustomJSLibCompatibilityDTO;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

@Slf4j
@ChangeUnit(order = "028", id = "customjslib-schema-update")
public class Migration028ModifyingCustomJSLibSchema {

    private final MongoTemplate mongoTemplate;
    private static final String CUSTOM_JS_LIB_COLLECTION_NAME = "customJSLib";

    public Migration028ModifyingCustomJSLibSchema(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * We are not using this method yet, however; this is mandatory to declare
     */
    @RollbackExecution
    public void rollbackExecution() {}

    /**
     * In this migration we will update the accessor of customJSLib from List<String> to List<Map<String, String>>
     */
    @Execution
    public void updateAccessorPropertyType() {
        mongoTemplate.stream(new Query(), CustomJSLibCompatibilityDTO.class, CUSTOM_JS_LIB_COLLECTION_NAME)
                .forEach(customJSLibCompatibilityDTO -> {
                    CustomJSLib customJSLib = new CustomJSLib(customJSLibCompatibilityDTO);
                    mongoTemplate.save(customJSLib);
                });
    }
}
