package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.http.codec.multipart.FilePart;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    String requestType;

    // Comma separated parameters in the correct order.
    // e.g. for GSheets, it may look like the following :
    // fileUrl, Sheet1, <HeaderRowIndex>
    // The above parameters would return all the column names
    Map<String, Object> parameters;

    ClientDataDisplayType displayType;

    List<Property> headers = new ArrayList<>();
    List<FilePart> files;

    String datasourceId;
    String actionId;
    String instanceId;
    String organizationId;
    // this param is expected to be sent by the client if needed
    String workspaceId;

    public TriggerRequestDTO(String requestType, Map<String, Object> parameters, ClientDataDisplayType displayType) {
        this.requestType = requestType;
        this.parameters = parameters;
        this.displayType = displayType;
    }
}
