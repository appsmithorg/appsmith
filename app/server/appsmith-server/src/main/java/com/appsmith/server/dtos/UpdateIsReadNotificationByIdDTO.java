package com.appsmith.server.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class UpdateIsReadNotificationByIdDTO extends UpdateIsReadNotificationDTO {
    @NotNull
    @NotEmpty
    private List<String> idList;
}
