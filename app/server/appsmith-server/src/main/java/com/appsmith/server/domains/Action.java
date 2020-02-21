package com.appsmith.server.domains;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@CompoundIndex(def = "{'pageId':1, 'name':1}", name = "action_page_compound_index", unique = true)
public class Action extends BaseDomain {

    String name;

    Datasource datasource;

    @JsonIgnore
    String datasourceId;

    String organizationId;

    String pageId;

    String collectionId;

    ActionConfiguration actionConfiguration;

    PluginType pluginType;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Boolean isValid;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Set<String> invalids;


    // This is a list of keys that the client whose values the client needs to send during action execution.
    // These are the Mustache keys that the server will replace before invoking the API
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Set<String> jsonPathKeys;

    String cacheResponse;

    String templateId; //If action is created via a template, store the id here.

    public Datasource getDatasource() {
        if (this.datasource != null) {
            //The action object has been created from JSON.
            return this.datasource;
        }

        //If the action object has been fetched from the db, it would not have datasource. Create and return one.
        if (this.getDatasourceId() != null) {
            Datasource datasource = new Datasource();
            datasource.setId(this.datasourceId);
            return datasource;
        }

        return null;
    }
}
