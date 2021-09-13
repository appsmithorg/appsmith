package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
            this.collection = (String) formData.get(COLLECTION);
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
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation : All mongo commands must implement parseCommand");
    }

    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation : All mongo commands must implement generateTemplate");
    }
}
