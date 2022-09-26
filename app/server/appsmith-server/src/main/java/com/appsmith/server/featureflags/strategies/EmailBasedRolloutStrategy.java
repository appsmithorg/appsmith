package com.appsmith.server.featureflags.strategies;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.ff4j.core.FeatureStore;
import org.ff4j.core.FlippingExecutionContext;
import org.ff4j.strategy.AbstractFlipStrategy;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
public class EmailBasedRolloutStrategy extends AbstractFlipStrategy {

    List<String> validDomains = new ArrayList<>();
    List<String> validEmails = new ArrayList<>();

    private static final String PARAM_EMAIL_DOMAINS = "emailDomains";
    private static final String PARAM_EMAILS = "emails";

    /** {@inheritDoc} */
    @Override
    public void init(String featureName, Map<String, String> initParam) {
        super.init(featureName, initParam);
        if(!initParam.containsKey(PARAM_EMAIL_DOMAINS) && !initParam.containsKey(PARAM_EMAILS)) {
            String msg = String.format("Either '%s' or '%s' is required for EmailBasedRolloutStrategy", PARAM_EMAIL_DOMAINS, PARAM_EMAILS);
            throw new IllegalArgumentException(msg);
        }
        if (!StringUtils.isEmpty(initParam.get(PARAM_EMAIL_DOMAINS))) {
            this.validDomains = Arrays.asList(initParam.get(PARAM_EMAIL_DOMAINS).split(","));
        }
        if (!StringUtils.isEmpty(initParam.get(PARAM_EMAILS))) {
            this.validEmails = Arrays.asList(initParam.get(PARAM_EMAILS).split(","));
        }
    }

    /** {@inheritDoc} */
    @Override
    public boolean evaluate(String featureName, FeatureStore store, FlippingExecutionContext executionContext) {
        User user = (User) executionContext.getValue(FieldName.USER, true);
        int atIndex = user.getEmail().indexOf("@");

        if (atIndex > 0) {
            // If the email domain is valid, check the user's email ID against the list of validated domains
            String domain = user.getEmail().substring(atIndex + 1).toLowerCase();
            if (validDomains.contains(domain)) {
                return true;
            } else {
                return validEmails.contains(user.getEmail());
            }
        }
        return false;

    }
}
