package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ce.NewActionCE;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class NewAction extends NewActionCE {
    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    Boolean isPublic;

    @JsonView(Views.Public.class)
    String rootModuleInstanceId;
}
