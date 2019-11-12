package com.appsmith.server.domains;

import com.appsmith.external.models.ActionConfiguration;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Action extends BaseDomain {

    String name;

    @Transient
    Datasource datasource;

    @JsonIgnore
    String datasourceId;

    String pluginId;

    String pageId;

    String collectionId;

    ActionConfiguration actionConfiguration;

    // This is a list of keys that the client whose values the client needs to send during action execution.
    // These are the Mustache keys that the server will replace before invoking the API
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Set<String> jsonPathKeys;

    public Datasource getDatasource() {
        if (this.datasource != null) {
            //The action object has been created from JSON.
            return this.datasource;
        }

        //The action object has been fetched from the db. It would not have datasource. Create and return one.
        Datasource datasource = new Datasource();
        datasource.setId(this.datasourceId);
        return datasource;
    }
}
