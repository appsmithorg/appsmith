# iOS Numeric Keypad Fix - Issue #41496

## Issue Analysis & Tracking

### GitHub Issue #41496
**Title**: [Bug]: Currency Input should open numeric keypad on iOS (inputmode/type missing)  
**Status**: Open  
**Severity**: Low (Cosmetic UI issues)  
**Environment**: iOS Safari, various iPhone models  
**Appsmith Version**: 1.94 (self-hosted)  

### Problem Statement

#### Current Behavior
- Currency Input on iOS opens **full keyboard** instead of numeric keypad
- Users must manually tap "123" to access numbers
- Significantly slows down data entry for cashier/POS workflows

#### Expected Behavior
- Currency Input should trigger numeric keypad (like `inputmode="decimal"` or `type="tel"`)
- Direct numeric entry without manual mode switching
- Seamless user experience on iOS Safari

#### Impact
- **User Segment**: Cashiers, Point-of-Sale operators
- **Business Impact**: Reduced transaction speed, UX friction
- **Platform**: iOS 12+ (Safari, Chrome, Firefox)

---

## Root Cause Analysis

### Current Implementation Gap
```tsx
// Current: CurrencyInputComponent passes inputHTMLType="NUMBER" to BaseInputComponent
<BaseInputComponent
  inputHTMLType="NUMBER"    // ← Becomes type="text" in production!
  // ... other props
/>
```

**Problem**: The `inputHTMLType="NUMBER"` isn't being properly mapped to `inputmode="decimal"` or `type="tel"` at the DOM level.

### Why This Happens
1. **BaseInputComponent.getType()** method handles PASSWORD, TEL, EMAIL but not NUMBER case
2. **Numeric inputs** use `StyledNumericInput` component from Blueprint
3. **StyledNumericInput** doesn't expose `inputmode` attribute
4. **iOS Safari** doesn't recognize `type="number"` as numeric keypad trigger

### Why `inputmode="decimal"` is Better Than `type="tel"`
- ✅ `inputmode="decimal"`: Proper semantic HTML5, shows dot/period on keyboard
- ⚠️ `type="tel"`: Fallback-only, doesn't validate decimal separators
- ❌ `type="number"`: Not fully supported on iOS Safari before v15

---

## Solution Architecture

### Approach: Progressive Enhancement

1. **Add `inputmode` prop to BaseInputComponentProps interface**
   - Allows widgets to specify desired keyboard behavior
   - Non-breaking: defaults to undefined

2. **Map `inputHTMLType` to appropriate `inputmode` value**
   - `NUMBER` → `inputmode="decimal"`
   - `TEL` → `inputmode="tel"` (already used)

3. **Support both `inputmode` (modern) and `type="tel"` (fallback)**
   - iOS Safari 13.0-14.x: Uses type="tel"
   - iOS Safari 15.0+, other browsers: Uses inputmode

4. **Pass through to actual input elements**
   - StyledNumericInput: Add inputmode prop
   - InputGroup (text): Add inputmode prop

### Browser Support Matrix
| Browser | inputmode | type="tel" | Notes |
|---------|-----------|-----------|-------|
| iOS Safari 15+ | ✅ Full | ✅ Fallback | Recommended |
| iOS Safari 13-14 | ⚠️ Partial | ✅ Full | Use type="tel" |
| iOS Chrome | ✅ Full | ✅ Fallback | Modern behavior |
| Android Chrome | ✅ Full | ✅ Fallback | Standard support |
| Desktop Safari | ✅ Full | ✅ Fallback | Keyboard input |

---

## Implementation Plan

### Files to Modify
1. **app/client/src/widgets/BaseInputWidget/component/index.tsx**
   - Add `inputmode` prop support
   - Implement mapping logic

2. **app/client/src/widgets/BaseInputWidget/constants.ts**
   - Add inputmode type definitions

3. **app/client/src/widgets/CurrencyInputWidget/component/index.tsx**
   - Pass `inputmode="decimal"` to BaseInputComponent

4. **app/client/src/widgets/CurrencyInputWidget/widget/index.tsx**
   - Add widget property documentation

### Commit Strategy (5+ commits for visibility)
1. **Add inputmode type support to constants**
2. **Update BaseInputComponent interface**
3. **Implement inputmode mapping logic**
4. **Apply inputmode to CurrencyInputWidget**
5. **Add comprehensive documentation**
6. **Add test verification**

---

## Verification Strategy

### Local Testing
```bash
# On iOS Safari, verify numeric keypad appears
# Test Currency Input with various values: 123, 45.67, -89.10

# Desktop verification (DevTools)
# Inspect <input> element for inputmode="decimal" attribute
```

### Cross-Browser Compatibility
- iOS Safari 13.0+ ✅
- iOS Chrome ✅
- iOS Firefox ✅
- Android Chrome ✅
- Desktop browsers ✅

---

## Production-Quality Checklist
- [ ] No breaking changes to existing APIs
- [ ] Backward compatible (graceful degradation)
- [ ] Type-safe TypeScript implementation
- [ ] Comprehensive inline documentation
- [ ] Tested on multiple iOS versions
- [ ] Proper error handling
- [ ] Performance optimized
- [ ] Accessibility compliant

---

## Related Resources

### iOS Keyboard Behavior
- [MDN: inputmode attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
- [iOS Safari Input Types](https://bugs.webkit.org/show_bug.cgi?id=138794)
- [Apple WebKit: inputmode Support](https://webkit.org/)

### Similar Fixes
- Material-UI: Added `inputMode` prop to TextField #17039
- React Native: `keyboardType="decimal-pad"` for iOS currency inputs

---

## Timeline
- **Phase 1** (Today): Environment setup & traceability ✅
- **Phase 2** (Next): Implementation & testing
- **Phase 3**: Documentation & PR submission

---

**Assignee**: Arbab  
**Date Created**: April 4, 2026  
**Issue URL**: https://github.com/appsmithorg/appsmith/issues/41496  
**Status**: In Progress 🚀
