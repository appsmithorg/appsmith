package com.appsmith.server.instanceconfigs.helpers.ce;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.instanceconfigs.helpers.InstanceVariablesHelper;
import com.appsmith.server.services.ConfigService;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class InstanceVariablesTest {

    @Mock
    private ConfigService configService;

    private InstanceVariablesHelper instanceVariablesHelper;

    @BeforeEach
    public void setUp() {
        instanceVariablesHelper = new InstanceVariablesHelper(configService);
    }

    @Test
    public void testGetInstanceName() {
        // Setup test data
        JSONObject instanceVariables = new JSONObject();
        instanceVariables.put("instanceName", "Test Instance");

        // Mock service call
        when(configService.getInstanceVariables()).thenReturn(Mono.just(instanceVariables));

        // Execute and verify
        StepVerifier.create(instanceVariablesHelper.getInstanceName())
                .expectNext("Test Instance")
                .verifyComplete();
    }

    @Test
    public void testGetInstanceNameWithDefault() {
        // Setup test data with no instanceName
        JSONObject instanceVariables = new JSONObject();

        // Mock service call
        when(configService.getInstanceVariables()).thenReturn(Mono.just(instanceVariables));

        // Execute and verify
        StepVerifier.create(instanceVariablesHelper.getInstanceName())
                .expectNext(Appsmith.DEFAULT_INSTANCE_NAME)
                .verifyComplete();
    }

    @Test
    public void testIsEmailVerificationEnabled() {
        // Setup test data
        JSONObject instanceVariables = new JSONObject();
        instanceVariables.put("emailVerificationEnabled", true);

        // Mock service call
        when(configService.getInstanceVariables()).thenReturn(Mono.just(instanceVariables));

        // Execute and verify
        StepVerifier.create(instanceVariablesHelper.isEmailVerificationEnabled())
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    public void testIsEmailVerificationEnabledWithDefault() {
        // Setup test data with no emailVerificationEnabled
        JSONObject instanceVariables = new JSONObject();

        // Mock service call
        when(configService.getInstanceVariables()).thenReturn(Mono.just(instanceVariables));

        // Execute and verify
        StepVerifier.create(instanceVariablesHelper.isEmailVerificationEnabled())
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    public void testGetGoogleMapsKey() {
        // Setup test data
        JSONObject instanceVariables = new JSONObject();
        instanceVariables.put("googleMapsKey", "test-maps-key");

        // Mock service call
        when(configService.getInstanceVariables()).thenReturn(Mono.just(instanceVariables));

        // Execute and verify
        StepVerifier.create(instanceVariablesHelper.getGoogleMapsKey())
                .expectNext("test-maps-key")
                .verifyComplete();
    }

    @Test
    public void testGetGoogleMapsKeyWithDefault() {
        // Setup test data with no googleMapsKey
        JSONObject instanceVariables = new JSONObject();

        // Mock service call
        when(configService.getInstanceVariables()).thenReturn(Mono.just(instanceVariables));

        // Execute and verify
        StepVerifier.create(instanceVariablesHelper.getGoogleMapsKey())
                .expectNext("")
                .verifyComplete();
    }
}
