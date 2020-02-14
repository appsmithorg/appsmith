package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Query extends BaseDomain {

    // This is the mustache template of the command that needs to be executed against a datasource url
    String commandTemplate;

    // The plugin to invoke while executing this query
    @DBRef
    Plugin plugin;

    String confirmationMsg;

    @Indexed(unique = true)
    String name;

    List<OldProperty> properties;

    List<OldProperty> headers;
}
