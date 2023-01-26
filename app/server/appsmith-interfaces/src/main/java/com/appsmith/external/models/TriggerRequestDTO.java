package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonView;

/**
 * This type conveys the action template and corresponding values to use
 * This would be evaluated at runtime and sent from the client as a result of
 * different conditions being met
 */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TriggerRequestDTO {

    @JsonView(Views.Public.class)
    String requestType;

    // Comma separated parameters in the correct order.
    // e.g. for GSheets, it may look like the following :
    // fileUrl, Sheet1, <HeaderRowIndex>
    // The above parameters would return all the column names
    @JsonView(Views.Public.class)
    Map<String, Object> parameters;

    @JsonView(Views.Public.class)
    ClientDataDisplayType displayType;
}
