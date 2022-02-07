package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Map;


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
    Condition condition; // where condition.
    List<String> projectionColumns; // columns to show to user.
    List<Map<String, String>> sortBy; // columns to sort by in ascending or descending order.
    Map<String, String> paginateBy;  // limit and offset
}
