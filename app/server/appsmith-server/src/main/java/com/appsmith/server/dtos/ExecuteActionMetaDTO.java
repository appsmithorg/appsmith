package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpHeaders;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ExecuteActionMetaDTO {
    String environmentId;
    HttpHeaders headers;
    boolean operateWithoutPermission = false;
}
