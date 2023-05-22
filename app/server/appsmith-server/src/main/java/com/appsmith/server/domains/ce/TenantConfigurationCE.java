/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains.ce;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class TenantConfigurationCE {

private String googleMapsKey;

private Boolean isFormLoginEnabled;

// We add `JsonInclude` here, so that this field is included in the JSON response, even if it is
// `null`. Reason is,
// if this field is not present, then the existing value in client's state doesn't get updated.
// It's just the way
// the splat (`...`) operator works in the client. Evidently, we'll want this for all fields in
// this class.
// In that sense, this class is special, because tenant configuration is cached in `localStorage`,
// and so it's state
// is preserved across browser refreshes.
@JsonInclude private List<String> thirdPartyAuths;

public void addThirdPartyAuth(String auth) {
	if (thirdPartyAuths == null) {
	thirdPartyAuths = new ArrayList<>();
	}
	thirdPartyAuths.add(auth);
}
}
