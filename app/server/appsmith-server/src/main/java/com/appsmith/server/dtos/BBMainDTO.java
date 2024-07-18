package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import net.minidev.json.JSONObject;
import org.springframework.data.annotation.Transient;

@Getter
@Setter
@NoArgsConstructor
@ToString
@FieldNameConstants
public class BBMainDTO {
    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @JsonView({Views.Public.class})
    String name;

    @JsonView({Views.Public.class})
    String icon;

    @JsonView({Views.Public.class})
    JSONObject dsl;
}
