// Export the installed Apple Big Sur photographic dynamic wallpaper for the web.
// Usage: swift scripts/export_big_sur.swift [source.heic] [output-directory]
// Requires macOS, ImageIO, UniformTypeIdentifiers, and CryptoKit.
// Apple owns the source artwork; this script does not confer redistribution rights.

import Foundation
import ImageIO
import UniformTypeIdentifiers
import CryptoKit

let defaultSource = FileManager.default.homeDirectoryForCurrentUser
    .appendingPathComponent("Library/Application Support/com.apple.mobileAssetDesktop/Big Sur.heic")
let input = CommandLine.arguments.count > 1
    ? URL(fileURLWithPath: CommandLine.arguments[1]) : defaultSource
let output = CommandLine.arguments.count > 2
    ? URL(fileURLWithPath: CommandLine.arguments[2])
    : URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        .appendingPathComponent("assets/img/big-sur", isDirectory: true)

func checksum(_ url: URL) throws -> String {
    SHA256.hash(data: try Data(contentsOf: url, options: .mappedIfSafe))
        .map { String(format: "%02x", $0) }.joined()
}

func writeJSON(_ value: Any, to url: URL) throws {
    var data = try JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted, .sortedKeys])
    data.append(0x0a)
    try data.write(to: url, options: .atomic)
}

try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
guard let source = CGImageSourceCreateWithURL(input as CFURL, nil) else {
    fatalError("Could not open \(input.path)")
}
let count = CGImageSourceGetCount(source)
guard count == 8 else {
    fatalError("Expected the eight-frame photographic Big Sur wallpaper, found \(count) frames")
}

guard let metadata = CGImageSourceCopyMetadataAtIndex(source, 0, nil),
      let solarValue = CGImageMetadataCopyStringValueWithPath(metadata, nil, "apple_desktop:solar" as CFString),
      let solarData = Data(base64Encoded: solarValue as String),
      let solar = try PropertyListSerialization.propertyList(from: solarData, format: nil) as? [String: Any]
else { fatalError("The source does not contain the expected Apple solar metadata") }
try writeJSON(solar, to: output.appendingPathComponent("apple-solar.json"))

var exports: [[String: Any]] = []
for index in 0..<count {
    try autoreleasepool {
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceThumbnailMaxPixelSize: 2560,
            kCGImageSourceCreateThumbnailWithTransform: true,
        ]
        guard let image = CGImageSourceCreateThumbnailAtIndex(source, index, options as CFDictionary) else {
            fatalError("Could not decode frame \(index)")
        }
        let filename = "big-sur-\(index).jpg"
        let destinationURL = output.appendingPathComponent(filename)
        guard let destination = CGImageDestinationCreateWithURL(
            destinationURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil
        ) else { fatalError("Could not create \(filename)") }
        // Retain the decoded image's P3 color space; apply no grading or tint.
        CGImageDestinationAddImage(destination, image, [
            kCGImageDestinationLossyCompressionQuality: 0.75,
        ] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else { fatalError("JPEG export failed") }
        let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any] ?? [:]
        let byteCount = try destinationURL.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        exports.append([
            "file": filename,
            "sourceIndex": index,
            "width": image.width,
            "height": image.height,
            "bytes": byteCount,
            "sha256": try checksum(destinationURL),
            "sourceColorProfile": properties[kCGImagePropertyProfileName] as? String ?? "unknown",
        ])
        print("Exported \(filename): \(image.width) × \(image.height), \(byteCount) bytes")
    }
}

let manifest: [String: Any] = [
    "artwork": "Apple macOS Big Sur photographic dynamic wallpaper",
    "copyright": "Apple Inc. Artwork is not covered by this repository's MIT license.",
    "sourceFilename": input.lastPathComponent,
    "sourceSHA256": try checksum(input),
    "sourceFrameCount": count,
    "sourceWidth": 6016,
    "sourceHeight": 6016,
    "exportLongestEdge": 2560,
    "jpegQuality": 0.75,
    "colorAdjustment": "None; ImageIO preserves the decoded image's P3 color space.",
    "appleMetadata": "apple-solar.json",
    "solarFields": ["a": "solar altitude in degrees", "z": "solar azimuth in degrees", "i": "HEIC frame index"],
    "dailyFrameOrder": [1, 2, 3, 0, 4, 5, 6, 7, 1],
    "timeNote": "Apple supplies solar coordinates, not clock times. Any website local-time schedule is a separate adaptation.",
    "exports": exports,
]
try writeJSON(manifest, to: output.appendingPathComponent("manifest.json"))
