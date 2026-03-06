# Server-Side Proxy Implementation Plan for AI Assistance

## Overview
Move AI API calls from client-side to server-side to eliminate sessionStorage security risk and keep API keys server-side only.

## Architecture Change

### Current Flow (Insecure)
```
Client → sessionStorage (API key) → Direct API call to Claude/OpenAI
```

### New Flow (Secure)
```
Client → Appsmith Server → Database (encrypted API key) → External AI API → Server → Client
```

## Implementation Plan

### Phase 1: Server-Side Service Layer

#### 1.1 Create AI Assistant Service (Java)
**File:** `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/AIAssistantServiceCE.java`

**Purpose:** Interface for AI assistant operations

**Methods:**
- `Mono<String> getAIResponse(String provider, String prompt, AIEditorContext context)`

#### 1.2 Implement AI Assistant Service
**File:** `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/AIAssistantServiceCEImpl.java`

**Purpose:** 
- Retrieve user's API key from database
- Make HTTP calls to Claude/OpenAI APIs
- Handle errors and rate limiting
- Return sanitized responses

**Dependencies:**
- `UserDataService` (already exists)
- `WebClient` (Spring WebFlux for HTTP calls)
- Error handling utilities

**Key Implementation:**
- Use `userDataService.getAIApiKey(provider)` to get decrypted key
- Use Spring `WebClient` to make external API calls
- Reuse prompt building logic from client-side service (move to shared utility or duplicate)

### Phase 2: Controller Endpoint

#### 2.1 Add AI Request Endpoint
**File:** `app/server/appsmith-server/src/main/java/com/appsmith/server/controllers/ce/UserControllerCE.java`

**New Endpoint:**
```java
@PostMapping("/ai-assistant/request")
public Mono<ResponseDTO<Map<String, String>>> requestAIResponse(
    @RequestBody AIRequestDTO request) {
    // Calls AIAssistantService
}
```

**Request DTO:**
```java
public class AIRequestDTO {
    private String provider; // "CLAUDE" or "OPENAI"
    private String prompt;
    private AIEditorContext context; // Simplified Java version
}
```

**Response:**
```java
{
    "response": "AI generated code",
    "provider": "CLAUDE"
}
```

### Phase 3: Client-Side Changes

#### 3.1 Update API Client
**File:** `app/client/src/ce/api/UserApi.tsx`

**Add Method:**
```typescript
static async requestAIResponse(
  provider: string,
  prompt: string,
  context: AIEditorContext,
): Promise<AxiosPromise<ApiResponse<{ response: string }>>> {
  return Api.post(`${UserApi.usersURL}/ai-assistant/request`, {
    provider,
    prompt,
    context,
  });
}
```

#### 3.2 Update Saga
**File:** `app/client/src/ce/sagas/AIAssistantSagas.ts`

**Changes:**
- Remove `sessionStorage.getItem()` calls
- Remove direct `AIAssistantService` calls
- Replace with `UserApi.requestAIResponse()` call
- Remove API key handling logic

**Simplified Saga:**
```typescript
function* fetchAIResponseSaga(action) {
  const { prompt, context } = action.payload;
  const aiState = yield select(getAIAssistantState);
  
  if (!aiState.hasApiKey || !aiState.provider) {
    yield put(fetchAIResponseError({ error: "..." }));
    return;
  }
  
  const response = yield call(
    UserApi.requestAIResponse,
    aiState.provider,
    prompt,
    context
  );
  
  yield put(fetchAIResponseSuccess({ response: response.data.data.response }));
}
```

#### 3.3 Update Settings Component
**File:** `app/client/src/pages/UserProfile/AISettings.tsx`

**Changes:**
- Remove `sessionStorage.setItem()` call
- Keep only Redux state update

#### 3.4 Remove Client-Side Service (Optional)
**File:** `app/client/src/ce/services/AIAssistantService.ts`

**Decision:** Can be removed entirely or kept for reference. Not used after proxy implementation.

### Phase 4: Data Transfer Objects

#### 4.1 Create AI Context DTO (Java)
**File:** `app/server/appsmith-server/src/main/java/com/appsmith/server/dtos/AIEditorContextDTO.java`

**Fields:**
```java
public class AIEditorContextDTO {
    private String functionName;
    private Integer cursorLineNumber;
    private String functionString;
    private String mode; // "javascript", "sql", etc.
}
```

#### 4.2 Create AI Request DTO
**File:** `app/server/appsmith-server/src/main/java/com/appsmith/server/dtos/AIRequestDTO.java`

**Fields:**
```java
public class AIRequestDTO {
    @NotBlank
    private String provider; // "CLAUDE" or "OPENAI"
    
    @NotBlank
    private String prompt;
    
    @NotNull
    private AIEditorContextDTO context;
}
```

## File Changes Summary

### New Files (3)
1. `AIAssistantServiceCE.java` - Service interface
2. `AIAssistantServiceCEImpl.java` - Service implementation
3. `AIEditorContextDTO.java` - Context DTO
4. `AIRequestDTO.java` - Request DTO

### Modified Files (4)
1. `UserControllerCE.java` - Add POST endpoint
2. `UserApi.tsx` - Add `requestAIResponse` method
3. `AIAssistantSagas.ts` - Simplify, remove sessionStorage
4. `AISettings.tsx` - Remove sessionStorage usage

### Files to Remove/Deprecate (1)
1. `AIAssistantService.ts` - Client-side service (no longer needed)

## Security Improvements

✅ **API keys never leave server** - Stored encrypted in database only
✅ **No client-side storage** - Eliminates XSS risk
✅ **Server-side validation** - All inputs validated before API calls
✅ **Rate limiting ready** - Can be added server-side easily
✅ **Audit logging ready** - Can log all AI requests server-side
✅ **Error sanitization** - Server can sanitize errors before sending to client

## Implementation Steps

1. **Create DTOs** (15 min)
   - AIEditorContextDTO
   - AIRequestDTO

2. **Create Service Interface** (10 min)
   - AIAssistantServiceCE interface

3. **Implement Service** (1-2 hours)
   - Get API key from UserDataService
   - Use `WebClientUtils.builder()` for WebClient (follows existing patterns)
   - Implement Claude API call with WebClient
   - Implement OpenAI API call with WebClient
   - Error handling and sanitization
   - Prompt building logic (reuse from client or duplicate)

4. **Add Controller Endpoint** (30 min)
   - POST /api/v1/users/ai-assistant/request
   - Request validation
   - Call service
   - Return response

5. **Update Client API** (15 min)
   - Add requestAIResponse method

6. **Update Saga** (30 min)
   - Remove sessionStorage logic
   - Replace with API call
   - Simplify error handling

7. **Update Settings** (10 min)
   - Remove sessionStorage.setItem

8. **Testing** (1 hour)
   - Test with valid API keys
   - Test error cases
   - Test rate limiting (if implemented)
   - Verify no keys in network traffic

## Estimated Time
**Total: 4-5 hours**

## Code Patterns to Follow

### WebClient Usage
Use `WebClientUtils.builder()` from `com.appsmith.util.WebClientUtils`:
```java
WebClient webClient = WebClientUtils.builder()
    .baseUrl("https://api.anthropic.com")
    .build();
```

### Error Handling
Follow pattern from `RequestUtils.java` in anthropicPlugin:
- Handle 401/403 as authentication errors
- Handle 429 as rate limit errors
- Sanitize error messages before returning to client

### Service Pattern
Follow pattern from existing services:
- Interface in `services/ce/`
- Implementation in `services/ce/` (not `services/`)
- Use `@Service` annotation
- Inject dependencies via constructor

## Implementation Code Examples

### 1. AIEditorContextDTO.java
```java
package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class AIEditorContextDTO {
    private String functionName;
    private Integer cursorLineNumber;
    private String functionString;
    private String mode;
}
```

### 2. AIRequestDTO.java
```java
package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AIRequestDTO {
    @NotBlank(message = "Provider is required")
    private String provider; // "CLAUDE" or "OPENAI"
    
    @NotBlank(message = "Prompt is required")
    private String prompt;
    
    @NotNull(message = "Context is required")
    private AIEditorContextDTO context;
}
```

### 3. AIAssistantServiceCE.java (Interface)
```java
package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.AIEditorContextDTO;
import reactor.core.publisher.Mono;

public interface AIAssistantServiceCE {
    Mono<String> getAIResponse(String provider, String prompt, AIEditorContextDTO context);
}
```

### 4. AIAssistantServiceCEImpl.java (Implementation - Key Parts)
```java
package com.appsmith.server.services.ce;

import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.dtos.AIEditorContextDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.UserDataService;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIAssistantServiceCEImpl implements AIAssistantServiceCE {
    
    private final UserDataService userDataService;
    private final ObjectMapper objectMapper;
    private final WebClient claudeWebClient = WebClientUtils.builder()
            .baseUrl("https://api.anthropic.com")
            .build();
    private final WebClient openaiWebClient = WebClientUtils.builder()
            .baseUrl("https://api.openai.com")
            .build();

    @Override
    public Mono<String> getAIResponse(String provider, String prompt, AIEditorContextDTO context) {
        AIProvider providerEnum;
        try {
            providerEnum = AIProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Invalid provider: " + provider));
        }

        return userDataService.getAIApiKey(provider)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "API key not configured")))
                .flatMap(apiKey -> {
                    if (providerEnum == AIProvider.CLAUDE) {
                        return callClaudeAPI(apiKey, prompt, context);
                    } else {
                        return callOpenAIAPI(apiKey, prompt, context);
                    }
                });
    }

    private Mono<String> callClaudeAPI(String apiKey, String prompt, AIEditorContextDTO context) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-5-sonnet-20241022");
        requestBody.put("max_tokens", 4096);
        requestBody.put("messages", new Object[]{
            Map.of("role", "user", "content", systemPrompt + "\n\n" + userPrompt)
        });

        return claudeWebClient.post()
                .uri("/v1/messages")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    if (response.statusCode().value() == 401 || response.statusCode().value() == 403) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_CREDENTIALS, "Invalid API key"));
                                    } else if (response.statusCode().value() == 429) {
                                        return Mono.error(new AppsmithException(AppsmithError.PLUGIN_DATASOURCE_RATE_LIMIT_ERROR));
                                    }
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR, "AI API request failed"));
                                }))
                .bodyToMono(JsonNode.class)
                .map(json -> json.path("content").get(0).path("text").asText(""))
                .doOnError(error -> log.error("Claude API error", error));
    }

    private Mono<String> callOpenAIAPI(String apiKey, String prompt, AIEditorContextDTO context) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4");
        requestBody.put("messages", new Object[]{
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userPrompt)
        });
        requestBody.put("temperature", 0.7);

        return openaiWebClient.post()
                .uri("/v1/chat/completions")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    if (response.statusCode().value() == 401 || response.statusCode().value() == 403) {
                                        return Mono.error(new AppsmithException(AppsmithError.INVALID_CREDENTIALS, "Invalid API key"));
                                    } else if (response.statusCode().value() == 429) {
                                        return Mono.error(new AppsmithException(AppsmithError.PLUGIN_DATASOURCE_RATE_LIMIT_ERROR));
                                    }
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR, "AI API request failed"));
                                }))
                .bodyToMono(JsonNode.class)
                .map(json -> json.path("choices").get(0).path("message").path("content").asText(""))
                .doOnError(error -> log.error("OpenAI API error", error));
    }

    private String buildSystemPrompt(AIEditorContextDTO context) {
        if ("javascript".equals(context.getMode())) {
            return "You are an expert JavaScript developer helping with Appsmith code. " +
                   "Appsmith is a low-code platform. Provide clean, efficient JavaScript code that follows best practices. " +
                   "Focus on the specific function or code block the user is working on.";
        } else {
            return "You are an expert SQL/query developer helping with database queries in Appsmith. " +
                   "Provide optimized, correct SQL queries that follow best practices. " +
                   "Consider the datasource type and ensure the query is syntactically correct.";
        }
    }

    private String buildUserPrompt(String prompt, AIEditorContextDTO context) {
        StringBuilder contextInfo = new StringBuilder();
        if (context.getFunctionName() != null && !context.getFunctionName().isEmpty()) {
            contextInfo.append("Function: ").append(context.getFunctionName()).append("\n");
        }
        if (context.getFunctionString() != null && !context.getFunctionString().isEmpty()) {
            contextInfo.append("Current function code:\n```\n")
                       .append(context.getFunctionString())
                       .append("\n```\n");
        }
        if (context.getCursorLineNumber() != null) {
            contextInfo.append("Cursor at line: ").append(context.getCursorLineNumber() + 1).append("\n");
        }
        return contextInfo + "\nUser request: " + prompt + "\n\nProvide the code solution:";
    }
}
```

### 5. Controller Endpoint Addition
```java
// In UserControllerCE.java

@JsonView(Views.Public.class)
@PostMapping("/ai-assistant/request")
public Mono<ResponseDTO<Map<String, String>>> requestAIResponse(
        @RequestBody @Valid AIRequestDTO request) {
    return aiAssistantService
            .getAIResponse(request.getProvider(), request.getPrompt(), request.getContext())
            .map(response -> {
                Map<String, String> result = new HashMap<>();
                result.put("response", response);
                result.put("provider", request.getProvider());
                return result;
            })
            .map(result -> new ResponseDTO<>(HttpStatus.OK, result))
            .onErrorResume(error -> {
                String errorMessage = error instanceof AppsmithException 
                    ? ((AppsmithException) error).getError().getMessage()
                    : "Failed to get AI response";
                return Mono.just(new ResponseDTO<>(HttpStatus.BAD_REQUEST, null, errorMessage));
            });
}
```

### 6. Client API Update
```typescript
// In UserApi.tsx

static async requestAIResponse(
  provider: string,
  prompt: string,
  context: AIEditorContext,
): Promise<AxiosPromise<ApiResponse<{ response: string; provider: string }>>> {
  return Api.post(`${UserApi.usersURL}/ai-assistant/request`, {
    provider,
    prompt,
    context,
  });
}
```

### 7. Saga Simplification
```typescript
// In AIAssistantSagas.ts - Simplified fetchAIResponseSaga

function* fetchAIResponseSaga(action: ReduxAction<FetchAIResponsePayload>) {
  try {
    const { prompt, context } = action.payload;
    const aiState = yield select(getAIAssistantState);

    if (!aiState.hasApiKey || !aiState.provider) {
      yield put(fetchAIResponseError({
        error: "AI API key not configured. Please configure it in your profile settings.",
      }));
      return;
    }

    const response = yield call(
      UserApi.requestAIResponse,
      aiState.provider,
      prompt,
      context,
    );

    if (response.data.responseMeta.success) {
      yield put(fetchAIResponseSuccess({ 
        response: response.data.data.response 
      }));
    } else {
      yield put(fetchAIResponseError({
        error: response.data.responseMeta.error?.message || "Failed to get AI response",
      }));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to get AI response";
    yield put(fetchAIResponseError({ error: errorMessage }));
    toast.show(errorMessage, { kind: "error" });
  }
}

// Simplified loadAISettingsSaga - no sessionStorage
function* loadAISettingsSaga() {
  try {
    const [claudeResponse, openaiResponse] = yield [
      call(UserApi.getAIApiKey, "CLAUDE"),
      call(UserApi.getAIApiKey, "OPENAI"),
    ];

    let provider: string | undefined;
    let hasApiKey = false;

    if (claudeResponse.data.responseMeta.success && 
        claudeResponse.data.data.hasApiKey) {
      provider = "CLAUDE";
      hasApiKey = true;
    } else if (openaiResponse.data.responseMeta.success && 
               openaiResponse.data.data.hasApiKey) {
      provider = "OPENAI";
      hasApiKey = true;
    }

    yield put(updateAISettings({ provider, hasApiKey }));
  } catch (error) {
    yield put(updateAISettings({ provider: undefined, hasApiKey: false }));
  }
}
```

### 8. Settings Component Update
```typescript
// In AISettings.tsx - Remove sessionStorage line

const handleSave = async () => {
  // ... existing code ...
  if (response.data.responseMeta.success) {
    // REMOVE THIS LINE:
    // sessionStorage.setItem(`ai_api_key_${provider}`, apiKey);
    
    dispatch(updateAISettings({ provider, hasApiKey: true }));
    toast.show("AI API key saved successfully", { kind: "success" });
    // ... rest of code ...
  }
};
```

## Minimal Changes Approach

To keep changes minimal:
- Reuse existing WebClient patterns from codebase
- Reuse error handling patterns
- Keep DTOs simple (match client-side types)
- Don't add rate limiting initially (can be added later)
- Don't add audit logging initially (can be added later)

## Testing Checklist

- [ ] API key retrieved correctly from database
- [ ] Claude API calls work
- [ ] OpenAI API calls work
- [ ] Error handling works (invalid key, rate limit, etc.)
- [ ] No API keys in client-side code
- [ ] No API keys in network traffic
- [ ] No sessionStorage usage
- [ ] Context properly passed from client to server
- [ ] Responses properly returned to client

## Rollback Plan

If issues arise:
1. Keep client-side service as fallback
2. Add feature flag to toggle between client/server calls
3. Can revert controller changes easily

## Dependencies to Add

### Java Dependencies (Already Present)
- Spring WebFlux (WebClient) ✅
- Jackson (JSON parsing) ✅
- Lombok ✅
- Validation API ✅

### No New Dependencies Required
All necessary dependencies are already in the project.

## Migration Strategy

### Option 1: Big Bang (Recommended for simplicity)
- Implement all changes at once
- Test thoroughly
- Deploy

### Option 2: Feature Flag (Safer)
- Add feature flag `ENABLE_AI_SERVER_PROXY`
- Keep both client and server implementations
- Toggle via feature flag
- Remove client code after validation

## Testing Strategy

1. **Unit Tests**
   - Test service methods with mocked WebClient
   - Test error handling scenarios
   - Test prompt building logic

2. **Integration Tests**
   - Test controller endpoint
   - Test with real API keys (use test keys)
   - Test error responses

3. **Security Tests**
   - Verify no API keys in network traffic
   - Verify no sessionStorage usage
   - Verify keys only in server logs (encrypted)

4. **Manual Testing**
   - Test Claude API calls
   - Test OpenAI API calls
   - Test error scenarios (invalid key, rate limit)
   - Test with different contexts (JS, SQL)

## Quick Implementation Checklist

### Backend (Java)
- [ ] Create `AIEditorContextDTO.java`
- [ ] Create `AIRequestDTO.java`
- [ ] Create `AIAssistantServiceCE.java` interface
- [ ] Create `AIAssistantServiceCEImpl.java` implementation
  - [ ] Inject `UserDataService` and `ObjectMapper`
  - [ ] Create WebClient instances for Claude and OpenAI
  - [ ] Implement `getAIResponse()` method
  - [ ] Implement `callClaudeAPI()` method
  - [ ] Implement `callOpenAIAPI()` method
  - [ ] Implement `buildSystemPrompt()` method
  - [ ] Implement `buildUserPrompt()` method
- [ ] Add endpoint to `UserControllerCE.java`
  - [ ] POST `/api/v1/users/ai-assistant/request`
  - [ ] Add `@Valid` annotation
  - [ ] Add error handling
- [ ] Add `AIAssistantService` to controller constructor

### Frontend (TypeScript)
- [ ] Update `UserApi.tsx`
  - [ ] Add `requestAIResponse()` method
- [ ] Update `AIAssistantSagas.ts`
  - [ ] Remove `sessionStorage.getItem()` calls
  - [ ] Remove direct `AIAssistantService` calls
  - [ ] Replace with `UserApi.requestAIResponse()`
  - [ ] Simplify `loadAISettingsSaga()` (remove sessionStorage check)
- [ ] Update `AISettings.tsx`
  - [ ] Remove `sessionStorage.setItem()` call
- [ ] (Optional) Remove `AIAssistantService.ts` client-side file

### Testing
- [ ] Test Claude API calls work
- [ ] Test OpenAI API calls work
- [ ] Test error handling (invalid key, rate limit)
- [ ] Verify no API keys in browser DevTools Network tab
- [ ] Verify no sessionStorage entries for API keys
- [ ] Test with JavaScript context
- [ ] Test with SQL context

## Key Benefits After Implementation

✅ **Security**: API keys never exposed to client
✅ **Compliance**: Better audit trail (server-side logging)
✅ **Control**: Can add rate limiting server-side
✅ **Reliability**: Server can handle retries and timeouts better
✅ **Monitoring**: Can monitor API usage and costs server-side
