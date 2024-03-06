package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import lombok.Data;

@Data
public class PublicEntityDTO {
    ActionCollectionDTO publicActionCollection;
    ActionDTO publicAction;
}
