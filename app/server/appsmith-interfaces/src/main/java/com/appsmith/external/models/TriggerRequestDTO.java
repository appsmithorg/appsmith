package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TriggerRequestDTO {

    String requestType;

    // Comma separated parameters in the correct order.
    // e.g. for GSheets, it may look like the following :
    // fileUrl, Sheet1, <HeaderRowIndex>
    // The above parameters would return all the column names
    Map<String, Object> parameters;

    ClientDataDisplayType displayType;
}
