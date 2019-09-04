package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.DBRef;


/*
 * Only used to store the settings that are different from the default values already set in setting collection
 */

@Getter
@Setter
@ToString
@NoArgsConstructor
public class OrganizationSetting extends BaseDomain {

    @DBRef
    private Setting setting;

    private String settingValue;

}
