package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.JSValue;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionCollectionViewCE_DTO {
    String id;
    String name;
    String pageId;
    String applicationId;
    List<JSValue> variables;
    List<ActionDTO> actions;
    String body;
}
