package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonView;


/**
 * This class is supposed to enclose all the parameters that are required to filter data as per the UQI
 * specifications. Currently, UQI specifies filtering data on the following parameters:
 *   o where clause
 *   o projection
 *   o pagination
 *   o sorting
 */
@Getter
@Setter
@ToString
@AllArgsConstructor
public class UQIDataFilterParams {
    @JsonView(Views.Public.class)
    Condition condition; // where condition.

    @JsonView(Views.Public.class)
    List<String> projectionColumns; // columns to show to user.

    @JsonView(Views.Public.class)
    List<Map<String, String>> sortBy; // columns to sort by in ascending or descending order.

    @JsonView(Views.Public.class)
    Map<String, String> paginateBy;  // limit and offset
}
