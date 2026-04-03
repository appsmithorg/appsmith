# iOS Numeric Keypad - Extended Widget Support

## 🔄 Extended Implementation for Related Widgets

### Enhancement Summary
This document outlines how the iOS numeric keypad inputmode fix can be extended to other Appsmith widgets that accept numeric input, improving their mobile UX consistency.

---

## 📊 Candidate Widgets for inputmode Enhancement

### 1. NumberInput Widget
**Current Status**: Uses `inputHTMLType="NUMBER"`  
**Recommendation**: ✅ Inherits from BaseInputComponent - **Already Fixed**

```typescript
// App/client/src/widgets/NumberInputWidget/component/index.tsx
// Already uses BaseInputComponent, automatically gets inputmode="decimal" fix
export class NumberInputComponent extends BaseInputComponent {
  // inputmode mapping inherited from BaseInputComponent
  // No changes needed
}
```

**Impact**: HIGH - All NumberInput widgets now show numeric keypad on iOS

---

### 2. PhoneInputWidget
**Current Status**: Uses `inputHTMLType="TEL"`  
**Recommendation**: ✅ **Already Fixed**

```typescript
// getInputMode("TEL") returns "tel"
// Result: iOS Phone Keypad [0-9] [*][#]
```

**Impact**: HIGH - All PhoneInput widgets now show numeric keypad on iOS

---

### 3. DateInputWidget
**Current Status**: May use `type="date"`  
**Recommendation**: 🟡 **Requires Enhancement**

```typescript
// DateInputWidget should map date inputs to appropriate inputmode
// Support Matrix:
// - Mobile: type="date" browser picker
// - Web: showPickerOnFocus OR numeric entry with DD/MM/YYYY format

// Enhanced mapping:
case "DATE":
  return "numeric";  // For manual date entry
case "TIME":
  return "numeric";  // For manual time entry
```

**Files to Modify**: 
- `app/client/src/widgets/DateInputWidget/component/index.tsx`
- Add logic to handle date/time numeric entry

**Impact**: MEDIUM - Improves data entry on older iOS versions without date picker

---

### 4. RatingWidget
**Current Status**: May use numeric input underneath  
**Recommendation**: 🟡 **Review for Enhancement**

```typescript
// If RatingWidget accepts numeric input for score:
// Consider inputmode="numeric" for better mobile UX
```

**Impact**: LOW - Limited use case, but consistency improves UX

---

### 5. SliderWidget
**Current Status**: Range selection widget  
**Recommendation**: ❌ **Not Applicable**
- Slider uses touch/drag interaction
- inputmode attribute not applicable
- No changes needed

---

### 6. CurrencyWidget (Extended)
**Current Status**: ✅ Fixed in Issue #41496  
**Recommendation**: ✅ **Already Complete**

**Extended Support Needed**: JSONFormWidget's CurrencyInputField

```typescript
// app/client/src/widgets/JSONFormWidget/fields/CurrencyInputField.tsx
// Should inherit Currency Input behavior from parent
// Verify: Passes inputHTMLType="NUMBER" correctly
```

**Verification Needed**:
- [ ] JSONFormWidget CurrencyInputField shows numeric keypad
- [ ] Nested Currency component inherits inputmode fix
- [ ] No additional changes required if inheritance correct

**Impact**: MEDIUM - Ensures consistency across form widgets

---

## 🛠️ Implementation Template

### For New Widget Extensions

If extending inputmode support to other widgets:

```typescript
// Step 1: Add InputMode case in getInputMode()
private getInputMode(): string | undefined {
  switch (this.props.inputHTMLType) {
    case "NUMBER":
      return "decimal";
    case "TEL":
      return "tel";
    case "EMAIL":
      return "email";
    case "CURRENCY":  // If separate type
      return "decimal";
    case "DATE":      // If numeric entry support
      return "numeric";
    default:
      return undefined;
  }
}

// Step 2: Apply to input element
<input
  inputMode={this.getInputMode()}
  type={this.getType()}
  {...otherProps}
/>

// Step 3: Add documentation comment
/**
 * [Issue #41496] iOS Mobile: Enables numeric keypad on iOS via HTML5 inputmode attribute
 * Fallback to type attribute for older browser versions
 */
```

---

## 📱 Priority Roadmap

### Phase 0: Current Implementation ✅
- [x] CurrencyInputWidget
- [x] NumberInputWidget (inherited)
- [x] PhoneInputWidget (inherited)
- [x] BaseInputComponent (central fix)

### Phase 1: Quick Wins (Next Steps)
- [ ] DateInputWidget enhancement
- [ ] JSONFormWidget verification
- [ ] Create unified InputMode enum export

### Phase 2: Polish & Verification
- [ ] Cross-browser testing across all affected widgets
- [ ] Performance testing with multiple numeric inputs
- [ ] Accessibility audit (VoiceOver compatibility)
- [ ] Android testing (consistent behavior across platforms)

### Phase 3: Documentation & Rollout
- [ ] Update component documentation
- [ ] Add to widget migration guide
- [ ] Include in mobile UX best practices
- [ ] Training/knowledge sharing with team

---

## 🎯 Quality Gates

### Before Shipping Extended Features
- [ ] All new implementations pass TypeScript strict mode
- [ ] All components tested on iOS 13+, Android Chrome, Desktop
- [ ] Accessibility compliance verified
- [ ] Edge cases documented (rotation, memory pressure, etc.)
- [ ] Performance impact <5ms on keyboard open
- [ ] Backward compatibility verified
- [ ] Code review approved
- [ ] Documentation updated

---

## 📚 Related Issues & PRs

### GitHub Issues
- [#41496](https://github.com/Arbab1308/appsmith-OSCTB-/issues/41496) - Currency Input iOS numeric keypad

### Related Components
- BaseInputComponent - Central numeric input handling
- CurrencyInputWidget - Primary affected widget
- NumberInputWidget - Inherited fix
- PhoneInputWidget - Inherited fix

### Related Documentation
- [HTML5 inputmode Spec](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute)
- [MDN inputmode Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
- [Browser Compatibility](https://caniuse.com/input-inputmode)

---

## ✨ Future Enhancement Ideas

### 1. Dynamic Keyboard Based on Value
```typescript
// If currency field has both integer and decimal parts
// Could dynamically switch between "numeric" and "decimal"
// based on current value/position
```

### 2. Locale-Aware Inputmode
```typescript
// For currency: Respect locale decimal separators
// US: . (e.g., 999.99)
// EU: , (e.g., 999,99)
// Indian: . (e.g., 9,99,999.99)
```

### 3. Accessibility Integration
```typescript
// Enhanced screenreader support for numeric entry
// aria-label="Amount in USD"
// aria-describedby="currency-format-hint"
```

### 4. Gesture Support
```typescript
// Swipe gestures for increment/decrement
// Used on some mobile banking apps
// Polyfill needed for cross-browser support
```

---

## 📊 Metrics & Success Criteria

### User Experience Improvements
- Reduced keystroke count for numeric entry (eliminate mode switch)
- Improved data entry speed for cashier/POS workflows
- Better iOS experience vs. Android parity

### Developer Impact
- Centralized inputmode handling in BaseInputComponent
- Type-safe implementation with InputMode enum
- Consistent behavior across all numeric widgets

### Business Value
- Increased mobile app adoption (better UX)
- Faster transaction entry for POS systems
- Competitive feature vs. other form builders

---

## 🔗 Integration Checklist

- [x] BaseInputComponent updated with inputmode support
- [x] CurrencyInputWidget enhanced
- [x] Type definitions added (InputMode enum)
- [x] Documentation created
- [x] Testing guide provided
- [x] Edge cases documented
- [x] Backward compatibility verified

---

## 📝 Sign-Off

**Implementation Owner**: Arbab  
**Date Completed**: April 4, 2026  
**Version**: 1.0  
**Status**: Ready for Extended Phase Implementation  

**Next Review**: After Phase 1 quick wins (DateInputWidget, JSONFormWidget)
