package com.appsmith.server.helpers.analytics;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.helpers.CollectionUtils;
import org.apache.commons.lang3.ObjectUtils;

import java.util.HashMap;
import java.util.Map;

public class UserDataAnalyticsUtils {
    private static final String ROLE = "role";
    private static final String PROFICIENCY = "proficiency";
    private static final String USE_CASE = "useCase";
    private static final String GOAL = "goal";
    private static final String MOST_RECENTLY_USED_WORKSPACE_ID = "mostRecentlyUsedWorkspaceId";

    public static Map<String, Object> getTraitsForIdentifyCall(
            UserData userData, boolean shouldAddRecentlyUsedWorkspaceId) {
        if (userData == null) {
            return new HashMap<>();
        }

        Map<String, Object> traits = new HashMap<>();
        traits.put(ROLE, userData.getRole());
        traits.put(PROFICIENCY, userData.getProficiency());
        traits.put(USE_CASE, userData.getUseCase());
        traits.put(GOAL, ObjectUtils.defaultIfNull(userData.getUseCase(), ""));

        if (!shouldAddRecentlyUsedWorkspaceId || CollectionUtils.isNullOrEmpty(userData.getRecentlyUsedEntityIds())) {
            return traits;
        }
        traits.put(
                MOST_RECENTLY_USED_WORKSPACE_ID,
                userData.getRecentlyUsedEntityIds().get(0).getWorkspaceId());
        return traits;
    }
}
