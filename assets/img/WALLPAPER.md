# macOS wallpaper assets

## Big Sur photographic dynamic wallpaper

The files in `big-sur/` are the eight original lighting states of Apple's Big Sur coastal landscape, exported from the HEIC installed on this Mac. These are photographs from the Big Sur dynamic desktop, not the similarly named abstract **Big Sur Graphic** artwork. No images were generated, recolored, or composited; the exports only resize and JPEG-encode the original frames.

The artwork is copyright Apple Inc. and is **not covered by this repository's MIT license**. Its inclusion does not grant a separate license to Apple's artwork.

### Provenance

- Installed source: `~/Library/Application Support/com.apple.mobileAssetDesktop/Big Sur.heic`
- Source SHA-256: `8c147037ba6f629b60258970fbda5bec91629ef6c25a0ee8531062f990162561`
- HEIC image count: 8; dimensions: 6016 × 6016 pixels per image
- System descriptor: `/System/Library/Desktop Pictures/Big Sur.madesktop`
- Descriptor values: `mobileAssetID = Big Sur`, `isDynamic = true`, `isSolar = true`
- Apple catalogue: `/System/Library/AssetsV2/com_apple_MobileAsset_DesktopPicture/com_apple_MobileAsset_DesktopPicture.xml`
- Catalogue identifier: `DesktopPictureID = Big Sur`, build `10M8877`
- [Apple CDN archive listed by that catalogue](https://updates.cdn-apple.com/2025/mobileassets/072-29818/74AF556A-DC02-429B-894B-23AB61E2A5F9/com_apple_MobileAsset_DesktopPicture/e9ff802c97332d002b37836419590a2b1ff3bcc9.zip)
- Export date: 2026-10-13

The installed HEIC was already available, so no archive download was necessary. No system wallpaper preferences were changed. The CDN entry is recorded for provenance; it was not downloaded or byte-compared with the local source.

### Frames and solar metadata

Each `big-sur/big-sur-N.jpg` retains the original HEIC index `N`. All exports are 2560 × 2560 JPEGs at ImageIO quality 0.75. Their P3 color profiles are preserved. Per-file byte counts and SHA-256 hashes are recorded in [the export manifest](big-sur/manifest.json).

Apple's `apple_desktop:solar` XMP property contains a Base64-encoded binary plist. The decoded, unmodified contents are saved in [apple-solar.json](big-sur/apple-solar.json). Its appearance selectors are `ap.l = 0` and `ap.d = 1`. In the `si` entries, `a` is solar altitude, `z` is solar azimuth, and `i` is the image index.

| HEIC index | Observed lighting | Altitude / azimuth in Apple's metadata |
| --- | --- | --- |
| 1 | Deep blue night with stars | −25° / 70° and −25° / 290° |
| 2 | Predawn blue and orange horizon | −9° / 80° |
| 3 | Sunrise | 0° / 90° |
| 0 | Clear morning light | 10° / 100° |
| 4 | Daylight and coastal clouds | 25° / 110° and 25° / 250° |
| 5 | Golden late-day light | 10° / 260° |
| 6 | Warm sunset | 0° / 270° |
| 7 | Purple dusk and clouds | −9° / 280° |

The visual sequence through a day is **1 → 2 → 3 → 0 → 4 → 5 → 6 → 7 → 1**. The source metadata specifies solar coordinates, **not fixed clock times**. The website's browser-local time schedule is a separate adaptation, not Apple's original location-dependent desktop scheduling. All eight exports were visually inspected together to verify their scene, order, and distinct lighting states.

### Reproduction

On a Mac with the original installed source, run from the repository root:

```sh
swift scripts/export_big_sur.swift
```

Alternatively pass the original HEIC and an output directory as two arguments. The [extraction script](../../scripts/export_big_sur.swift) uses ImageIO, UniformTypeIdentifiers, and CryptoKit; it requires no third-party packages. It checks the eight-frame container and solar metadata, applies the source orientation, preserves the decoded image color space, exports all frames, and writes the two JSON records.

## Previous Sonoma exports

These two backgrounds were exported from the Sonoma wallpaper already installed on this Mac. The artwork is by Apple and is not part of this repository's original MIT-licensed artwork.

### Source

- Local system asset: `/System/Library/Desktop Pictures/Sonoma.heic`
- Original dimensions: 6016 × 6016 pixels per image
- Container: HEIC with two images, selected after visually inspecting both
- Image index 0: light appearance, blue/lilac sky, coral band, green curved layers
- Image index 1: dark appearance, blue/violet sky and deeper green curved layers
- Source SHA-256: `49abdac0cdd3aaebdc98f1e1be9b837bb625c22d9b35f5bafe48e12c8f4a64f2`
- Export date: 2026-10-13

No video was downloaded, and no system wallpaper settings were changed. The JPEGs are static light/dark images; any webpage motion is applied separately in CSS.

### Web exports

| File | Image index | Dimensions | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `wallpaper-light.jpg` | 0 | 2560 × 2560 | 307,074 bytes | `2b89140710e341da8de07234d06208f352d345666c370077e11ba606b1769cc0` |
| `wallpaper-dark.jpg` | 1 | 2560 × 2560 | 254,410 bytes | `0c83477e7cd227189003b7672c489e8ef6b0afc4ddf17b2b74efdcf3287ea5a8` |

Total size: 561,484 bytes (about 548 KiB). Both files retain their Display P3 color profile. Their square source composition is retained so the browser can use `background-size: cover` across desktop and mobile viewports.

### Extraction

Exported using macOS Swift, ImageIO, and UniformTypeIdentifiers. ImageIO decoded each HEIC image, scaled its longest edge to 2560 pixels, applied the source orientation, and encoded JPEG at quality 0.78. Both final JPEGs were opened and visually checked.

To reproduce on a Mac with this exact source asset, run the following Swift from the repository root:

```swift
import Foundation
import ImageIO
import UniformTypeIdentifiers

let input = URL(fileURLWithPath: "/System/Library/Desktop Pictures/Sonoma.heic")
let outputDirectory = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("assets/img", isDirectory: true)
guard let source = CGImageSourceCreateWithURL(input as CFURL, nil) else {
    fatalError("Could not read Sonoma.heic")
}
for (index, filename) in [(0, "wallpaper-light.jpg"), (1, "wallpaper-dark.jpg")] {
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceThumbnailMaxPixelSize: 2560,
        kCGImageSourceCreateThumbnailWithTransform: true,
    ]
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, index, options as CFDictionary),
          let destination = CGImageDestinationCreateWithURL(
              outputDirectory.appendingPathComponent(filename) as CFURL,
              UTType.jpeg.identifier as CFString, 1, nil
          ) else { fatalError("Could not decode or export wallpaper") }
    CGImageDestinationAddImage(destination, image, [
        kCGImageDestinationLossyCompressionQuality: 0.78,
    ] as CFDictionary)
    guard CGImageDestinationFinalize(destination) else { fatalError("JPEG export failed") }
}
```
