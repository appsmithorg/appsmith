package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.ApplicationDetailCE;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode(callSuper = true)
public class ApplicationDetail extends ApplicationDetailCE {
    public ApplicationDetail() {
        super();
    }
}
