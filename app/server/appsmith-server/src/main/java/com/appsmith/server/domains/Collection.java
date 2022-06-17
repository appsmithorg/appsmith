package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Collection extends BaseDomain {

    String name;

    String applicationId;

    String organizationId;

    Boolean shared;

    //To save space, when creating/updating collection, only add Action's id field instead of the entire action.
    List<NewAction> actions;
}
