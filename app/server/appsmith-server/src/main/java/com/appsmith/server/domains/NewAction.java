package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.NewActionCE;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@Document
@FieldNameConstants
public class NewAction extends NewActionCE {
    public static class Fields extends NewActionCE.Fields {}
}
