package com.appsmith.external.dtos;

import com.appsmith.external.git.constants.ce.RefType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GitRefDTO {

    String refName;

    RefType refType;

    boolean isDefault;

    boolean createdFromLocal;
}
