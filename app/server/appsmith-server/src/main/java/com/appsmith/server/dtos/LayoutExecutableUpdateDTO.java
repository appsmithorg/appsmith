package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/**
 * This class would be used to send any action updates that have happened as part of update layout. The client should
 * consume this structure to update the actions in its local storage (instead of fetching all the page actions afresh).
 */
public class LayoutExecutableUpdateDTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String collectionId;

    @JsonView(Views.Public.class)
    Boolean executeOnLoad;
}
