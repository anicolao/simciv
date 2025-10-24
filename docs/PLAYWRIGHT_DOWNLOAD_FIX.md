# Playwright Browser Download Fix

## Problem Statement

Playwright's browser download fails with the following error:
```
Error: Download failed: size mismatch, file size: 182333649, expected size: 0
```

This error occurred when trying to install Chromium browsers using `npx playwright install chromium`.

## Root Cause Analysis

The issue has two components:

### 1. CDN Redirect with Content-Length: 0

Playwright's CDN (cdn.playwright.dev) returns a 307 Temporary Redirect with `Content-Length: 0`:

```bash
$ curl -I https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1194/chromium-linux.zip
HTTP/1.1 307 Temporary Redirect
Content-Length: 0  # <-- Problem: this is used instead of the final response
Location: https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/chromium/1194/chromium-linux.zip
```

The actual file at the redirect location has the correct size:
```bash
$ curl -I https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/chromium/1194/chromium-linux.zip
HTTP/1.1 200 OK
Content-Length: 182333649  # <-- This is correct
```

### 2. Progress Bar Crash

When `totalBytes` is 0, the progress bar code crashes with:
```
RangeError: Invalid count value: Infinity
    at String.repeat (<anonymous>)
```

This happens in `browserFetcher.js` line 163:
```javascript
console.log(`|${"\u25A0".repeat(row * stepWidth)}${" ".repeat((totalRows - row) * stepWidth)}| ...`);
```

When `totalBytes` is 0:
- `percentage = downloadedBytes / 0` → `NaN`
- `row = Math.floor(NaN)` → `NaN`
- `"\u25A0".repeat(NaN * stepWidth)` → `"\u25A0".repeat(Infinity)` → crash

## Solution

We apply two patches to Playwright's code in `node_modules`:

### Patch 1: Handle totalBytes=0 in Progress Bar
**File**: `node_modules/playwright-core/lib/server/registry/browserFetcher.js`

**What it does**: Check if `totalBytes` is 0 and skip the percentage-based progress bar, showing just the downloaded size instead.

**Code change**:
```javascript
return (downloadedBytes, totalBytes) => {
  // Handle case where totalBytes is 0 (from redirect with Content-Length: 0)
  if (!totalBytes || totalBytes === 0) {
    if (downloadedBytes > 0 && lastRow < 0) {
      console.log(`Downloading... ${toMegabytes(downloadedBytes)} received`);
      lastRow = 0;
    }
    return;
  }
  // ... rest of progress bar code
};
```

### Patch 2: Skip Size Validation When totalBytes=0
**File**: `node_modules/playwright-core/lib/server/registry/oopDownloadBrowserMain.js`

**What it does**: Skip size validation when `totalBytes` is 0, since the download actually completed successfully.

**Code change**:
```javascript
file.on("finish", () => {
  // Skip size validation if totalBytes is 0 (from redirect with Content-Length: 0)
  if (totalBytes === 0) {
    log(`-- download complete (no size check - totalBytes was 0), actual size: ${downloadedBytes}`);
    promise.resolve();
  } else if (downloadedBytes !== totalBytes) {
    // ... size mismatch error
  } else {
    log(`-- download complete, size: ${downloadedBytes}`);
    promise.resolve();
  }
});
```

## Implementation

### Automatic Patching

The patches are automatically applied after `npm install` via the `postinstall` script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "node scripts/patch-playwright.js"
  }
}
```

The `scripts/patch-playwright.js` file contains the patching logic and is idempotent (safe to run multiple times).

### Manual Patching

If you need to reapply the patches manually:

```bash
node scripts/patch-playwright.js
```

## Verification

Test that browser installation works:

```bash
npx playwright install chromium
```

Expected output:
```
Downloading Chromium 141.0.7390.37 (playwright build v1194) from https://cdn.playwright.dev/...
Downloading... 0 MiB received
Chromium 141.0.7390.37 (playwright build v1194) downloaded to /home/runner/.cache/ms-playwright/chromium-1194
```

## Benefits

1. **Uses Playwright's bundled browsers**: No need to rely on system-installed Chrome/Chromium
2. **Consistent across environments**: Same browser version used everywhere
3. **Automatic**: Patches apply during `npm install`
4. **Minimal changes**: Only fixes the specific bugs without modifying Playwright's overall behavior
5. **Safe**: Patches are defensive and don't break existing functionality

## Alternative Solutions Considered

### 1. Use System Chrome/Chromium (Previous Approach)
- ✅ Works reliably
- ✅ No patching needed
- ⚠️  Requires Chrome/Chromium to be installed
- ⚠️  Browser version varies by environment
- ⚠️  Complex configuration with `CHROMIUM_PATH` environment variable

### 2. Use PLAYWRIGHT_DOWNLOAD_HOST Environment Variable
- Attempted to bypass redirect by pointing directly to Microsoft CDN
- ❌ Still resulted in the same size mismatch error
- ❌ Doesn't fix the underlying Content-Length: 0 issue

### 3. Patch Playwright (Current Approach - CHOSEN)
- ✅ Fixes the root cause
- ✅ Uses bundled browsers as intended
- ✅ Consistent behavior across environments
- ✅ Automatic via postinstall script
- ⚠️  Patches `node_modules` (reapplied after each install)

## Future Considerations

If Playwright fixes this issue upstream:
1. The patches will become no-ops (checking for already-patched code)
2. We can eventually remove `scripts/patch-playwright.js` and the postinstall script
3. Document in release notes when this is safe to do

## Related Files

- `scripts/patch-playwright.js` - Patching script
- `package.json` - Contains postinstall script
- `playwright.config.ts` - Playwright configuration (now uses bundled Chromium)
- `bin/e2e-setup` - E2E test setup script
- `docs/E2E_TEST_SETUP.md` - E2E test setup guide

## Technical Details

The patches are applied to these specific functions:
- `getBasicDownloadProgress()` in `browserFetcher.js`
- `downloadFile()` callback in `oopDownloadBrowserMain.js`

Both patches are defensive and handle the edge case where `totalBytes` is 0 or undefined.
