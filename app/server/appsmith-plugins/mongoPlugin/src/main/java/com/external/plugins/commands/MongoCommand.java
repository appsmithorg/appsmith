package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.external.plugins.exceptions.MongoPluginError;
import com.external.plugins.exceptions.MongoPluginErrorMessages;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.COLLECTION;

/**
 * This is the base class which every Mongo Command extends. Common functions across all mongo commands
 * are implemented here including reading and validating the collection. This also defines functions which should be
 * implemented by all the commands.
 */
@Getter
@Setter
@NoArgsConstructor
public abstract class MongoCommand {
    String collection;
    List<String> fieldNamesWithNoConfiguration;
    protected static final ObjectMapper objectMapper = new ObjectMapper();

    public MongoCommand(ActionConfiguration actionConfiguration) {

        this.fieldNamesWithNoConfiguration = new ArrayList<>();

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, COLLECTION)) {
            this.collection = PluginUtils.getDataValueSafelyFromFormData(formData, COLLECTION, STRING_TYPE);
        }
    }

    public Boolean isValid() {
        if (StringUtils.isNullOrEmpty(this.collection)) {
            fieldNamesWithNoConfiguration.add(COLLECTION);
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }

    public Document parseCommand() {
        throw new AppsmithPluginException(MongoPluginError.UNSUPPORTED_OPERATION, MongoPluginErrorMessages.UNSUPPORTED_OPERATION_PARSE_COMMAND_ERROR_MSG);
    }

    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        throw new AppsmithPluginException(MongoPluginError.UNSUPPORTED_OPERATION, MongoPluginErrorMessages.UNSUPPORTED_OPERATION_GENERATE_TEMPLATE_ERROR_MSG);
    }

    public String getRawQuery() {
        throw new AppsmithPluginException(MongoPluginError.UNSUPPORTED_OPERATION, MongoPluginErrorMessages.UNSUPPORTED_OPERATION_GET_RAW_QUERY_ERROR_MSG);
    }
}
