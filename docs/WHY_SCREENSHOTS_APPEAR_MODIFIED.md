# E2E Screenshot Visual Regression Testing

## The Approach

E2E tests use visual regression testing to validate UI appearance. Screenshots are compared against expected versions, and **tests fail if visual changes are detected**, requiring developer review and approval.

## Why Visual Regression Testing?

### The Challenge

Manual visual inspection of UI is:
- Time-consuming
- Error-prone
- Difficult to catch subtle regressions
- Hard to maintain consistency across features

### The Solution

Automated screenshot comparison:
- **Detects** visual changes immediately
- **Requires** developer review before acceptance
- **Prevents** accidental regressions from reaching production
- **Documents** expected UI appearance

## How It Works

### Normal Test Run (Validation Mode)

When `page.screenshot()` is called via our helper:

1. **Capture**: Take screenshot to memory buffer
2. **Hash**: Calculate SHA-256 hash of screenshot
3. **Compare**: Check against expected screenshot's hash
4. **Result**:
   - ✅ **Pass**: Hashes match (no visual change)
   - ❌ **Fail**: Hashes differ (visual change detected)
   - 📸 **Create**: File doesn't exist (first-time setup)

### Why Tests Fail on Visual Changes

This is **intentional behavior** to ensure:

1. **Visual changes are intentional**: Developer explicitly approves UI modifications
2. **Regressions are caught**: Unintended visual changes are detected immediately
3. **Changes are reviewed**: Screenshots are inspected before updating expectations
4. **Git history is clean**: Only approved changes are committed

## Developer Workflow

### When Test Fails Due to Screenshot Mismatch

```
❌ Error: Screenshot mismatch: 02-registration-form-filled.png

The screenshot differs from the expected version.

Next steps:
1. Inspect the screenshot at: e2e-screenshots/02-registration-form-filled.png
2. If the visual change is correct and expected:
   - Run: UPDATE_SCREENSHOTS=1 npm run test:e2e
   - Verify tests pass: npm run test:e2e
   - Commit the updated screenshot
3. If the visual change is incorrect:
   - Fix the source of the visual difference
   - Revert the screenshot: git checkout -- e2e-screenshots/02-registration-form-filled.png
   - Run tests again: npm run test:e2e
```

### Step 1: Review the Visual Change

Inspect the screenshot file mentioned in the error message:
- Open `e2e-screenshots/02-registration-form-filled.png`
- Compare with your expectations for the UI
- Determine if the change is correct

### Step 2A: Accept the Change (Correct)

If the visual change is intentional and correct:

```bash
# Update expected screenshots
UPDATE_SCREENSHOTS=1 npm run test:e2e

# Output:
# 📸 Updated expected screenshot: 02-registration-form-filled.png

# Verify stability (run without update mode)
npm run test:e2e

# Should pass:
# ✓ Screenshot matches expected: 02-registration-form-filled.png

# Commit new expectations
git add e2e-screenshots/
git commit -m "Update screenshot expectations for button redesign"
```

### Step 2B: Reject the Change (Incorrect)

If the visual change is unintended or incorrect:

```bash
# Revert screenshot to expected version
git checkout -- e2e-screenshots/02-registration-form-filled.png

# Fix the source code causing the visual regression
# (e.g., fix CSS bug, correct component logic)

# Run tests again
npm run test:e2e

# Should pass now:
# ✓ Screenshot matches expected: 02-registration-form-filled.png
```

## Benefits of This Approach

### 1. Visual Regressions Caught Immediately

Unintended UI changes cause test failures:
```bash
# Developer accidentally breaks layout
npm run test:e2e

### Visual Regression Testing Helper

The helper (`e2e/helpers/screenshot.ts`) provides:

```typescript
// Visual regression testing - fails test if screenshot differs
await screenshotIfChanged(page, { 
  path: 'e2e-screenshots/01-test.png', 
  fullPage: true 
});
```

**Behavior**:
- Takes screenshot to memory buffer
- Calculates SHA-256 hash
- Compares with expected screenshot's hash
- **Throws error** if hashes differ (test fails)
- Passes test if hashes match
- Creates file if it doesn't exist

### Update Mode

Set `UPDATE_SCREENSHOTS=1` to update expectations:

```bash
UPDATE_SCREENSHOTS=1 npm run test:e2e
```

In update mode:
- Screenshots that differ **update the expected files**
- No test failures for mismatches
- Used after reviewing and approving changes

## Technical Details

### Why SHA-256 Comparison?

- **Cryptographically secure**: Virtually impossible to have hash collision
- **Fast**: Much faster than pixel-by-pixel comparison
- **Deterministic**: Same content always produces same hash
- **Reliable**: Independent of PNG encoding variations

### Performance Impact

- **Minimal overhead**: Hash calculation is fast (< 10ms per screenshot)
- **No I/O waste**: Only writes when necessary
- **Clear failures**: Tests fail fast on visual changes

## Example Scenarios

### Scenario 1: No Visual Changes

```bash
npm run test:e2e

# Output:
# ✓ Screenshot matches expected: 01-initial-load.png
# ✓ Screenshot matches expected: 02-registration-form-filled.png
# ✓ Screenshot matches expected: 03-authenticated.png
# All tests pass
```

### Scenario 2: Intentional UI Update

```bash
# Developer updates button color
npm run test:e2e

# Output:
# ✓ Screenshot matches expected: 01-initial-load.png
# ❌ Error: Screenshot mismatch: 02-registration-form-filled.png
# Test fails

# Developer reviews - looks good!
UPDATE_SCREENSHOTS=1 npm run test:e2e

# Output:
# ✓ Screenshot matches expected: 01-initial-load.png
# 📸 Updated expected screenshot: 02-registration-form-filled.png
# All tests pass

# Verify stability
npm run test:e2e

# Output:
# ✓ Screenshot matches expected: 01-initial-load.png  
# ✓ Screenshot matches expected: 02-registration-form-filled.png
# All tests pass

# Commit
git add e2e-screenshots/
git commit -m "Update screenshots for new button styling"
```

### Scenario 3: Unintended Regression

```bash
# Developer refactors CSS
npm run test:e2e

# Output:
# ❌ Error: Screenshot mismatch: 03-authenticated.png
# Test fails

# Developer reviews - unexpected layout shift!
git checkout -- e2e-screenshots/03-authenticated.png

# Fix CSS bug
npm run test:e2e

# Output:
# ✓ Screenshot matches expected: 03-authenticated.png
# All tests pass
```

## Summary

**The Approach**: Visual regression testing with required approval

**The Behavior**: Tests fail when screenshots differ from expectations

**The Workflow**: Review → approve/reject → verify → commit

**The Benefit**: Prevents unintended visual regressions while allowing intentional changes

## Related Documentation

- `e2e/helpers/screenshot.ts` - Implementation
- `e2e-screenshots/README.md` - Detailed workflow documentation
- `e2e/README.md` - E2E testing documentation
- `docs/SCREENSHOT_HELPER_SOLUTION.md` - Complete solution guide
