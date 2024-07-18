package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@FieldNameConstants
public class BuildingBlockHack extends BranchAwareDomain {
    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    JSONObject dsl;

    @JsonView(Views.Public.class)
    String icon;

    @JsonView(Views.Public.class)
    List<String> actionIds;
}
