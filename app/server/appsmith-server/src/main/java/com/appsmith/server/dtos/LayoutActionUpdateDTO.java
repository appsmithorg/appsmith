package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/**
 * This class would be used to send any action updates that have happened as part of update layout. The client should
 * consume this structure to update the actions in its local storage (instead of fetching all the page actions afresh).
 */
public class LayoutActionUpdateDTO {
    String id;
    String name;
    Boolean executeOnLoad;
}
