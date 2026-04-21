# Fix: Landing Video Not Playing on Safari

## Problem Statement

The hero `<video>` on the landing page (`src/app/page.tsx`) plays in Chrome/Firefox but fails (black frame or poster-only, no playback) in Safari on macOS and iOS.

Source of failure identified via `ffprobe`:

```
codec_name=h264
profile=High
pix_fmt=yuvj420p   ← root cause
```

Safari (WebKit) will not decode MP4s with `yuvj420p` ("JPEG" full-range YUV). It requires standard studio-range `yuv420p`. This is the single most common cause of "plays everywhere except Safari" for H.264 MP4s. The poster loads because it's a JPEG, but the video stream is rejected on first decode.

Secondary risks to verify while fixing:
- `High` profile at unusual level can also choke older iOS — safer to target `Main` or `Baseline` profile if footage allows.
- No `type="video/mp4"` codecs hint is present; not required but helps.
- `Content-Type` served by Next.js static file handler is correct (`video/mp4`) — no action needed unless custom headers were added.

## Objective

Landing video autoplays inline on:
- Safari 17+ macOS
- Mobile Safari iOS 16+
- Chrome + Firefox (no regression)

## Approach

Re-encode `public/demo.mp4` to Safari-compatible H.264 (`yuv420p`, `+faststart` for progressive load). Keep the existing `<video>` markup — it is already correct (`muted`, `playsInline`, `autoPlay`, `preload="auto"`, poster set). The markup is not the bug; the asset is.

Do **not** add a WebM fallback unless the re-encode fails — Safari's H.264 support is universal once the pixel format is fixed, and a second asset doubles bundle weight for no gain.

## Implementation Steps

### 1. Re-encode the video (surgical — one file changes)

From repo root:

```bash
cd apps/accountantproject/public

# Backup the current file in case we need to revert
cp demo.mp4 demo.original.mp4

# Re-encode: yuv420p pixel format, Main profile, web-optimized
ffmpeg -i demo.original.mp4 \
  -c:v libx264 -profile:v main -level 4.0 -pix_fmt yuv420p \
  -movflags +faststart \
  -crf 22 -preset slow \
  -c:a aac -b:a 128k -ac 2 \
  demo.mp4
```

Flags explained (only what matters):
- `-pix_fmt yuv420p` — the fix.
- `-profile:v main -level 4.0` — broad Safari/iOS coverage.
- `-movflags +faststart` — moves MOOV atom to file start so playback begins before full download.
- `-crf 22` — visually indistinguishable from source at this resolution.
- Audio re-muxed to AAC even though video is muted, because some WebKit builds still reject files with unsupported/missing audio tracks on autoplay.

### 2. Verify the output

```bash
ffprobe -v error -show_entries stream=codec_name,profile,pix_fmt -of default=noprint_wrappers=1 demo.mp4
```

Expected:
```
codec_name=h264
profile=Main
pix_fmt=yuv420p
```

Check file size stayed reasonable (current is 1.6 MB — target <3 MB):
```bash
ls -lh demo.mp4
```

### 3. Delete the backup once verified

```bash
rm demo.original.mp4
```

### 4. No code changes required

The JSX in `src/app/page.tsx:312-315` is already correct for Safari autoplay:
- `muted` ✓ (required for autoplay)
- `playsInline` ✓ (required on iOS to avoid fullscreen takeover)
- `autoPlay` ✓
- `poster="/demo-poster.jpg"` ✓

Leave it alone. Surgical change = asset only.

## Testing / Success Criteria

Transform the fix into verifiable goals:

1. **Asset is Safari-compatible** → verify: `ffprobe` shows `pix_fmt=yuv420p` and `profile=Main`.
2. **Video autoplays in desktop Safari** → verify: open `http://localhost:3000` in Safari macOS, video is moving within 2s of page load (not just poster).
3. **Video autoplays in mobile Safari** → verify: open same URL on iPhone Safari, video plays inline (does NOT open fullscreen player), no tap required.
4. **No regression in Chrome/Firefox** → verify: video still plays in both, no console errors.
5. **File size not bloated** → verify: `demo.mp4` ≤ 3 MB.

If step 2 or 3 fails after the re-encode, check Safari's Web Inspector → Network tab for the video request. A failed request means server/Content-Type issue (unlikely with Next.js defaults). A successful request with no playback means try re-encoding with `-profile:v baseline -level 3.1` (maximum compatibility, slightly larger file).

## Rollback

If the re-encode produces visibly worse quality or Safari still fails, restore from `demo.original.mp4` before deleting the backup.

## Out of Scope

- Adding a WebM/AV1 source (unnecessary once H.264 is fixed; adds build complexity).
- Lazy-loading the video (separate perf concern).
- Converting the `<video>` to a `<picture>`/image fallback (not requested).
