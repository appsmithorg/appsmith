package com.appsmith.server.dtos;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.server.domains.NewPage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CreateActionMetaDTO {
    Boolean isJsAction;
    AppsmithEventContext eventContext;
    NewPage newPage;
}
