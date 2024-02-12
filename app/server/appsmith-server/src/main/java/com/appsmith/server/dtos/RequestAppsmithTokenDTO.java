package com.appsmith.server.dtos;

import com.appsmith.external.models.CreatorContextType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestAppsmithTokenDTO {
    String contextId;
    CreatorContextType contextType;
}
