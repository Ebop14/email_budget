// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ReceiptCapture",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "ReceiptCapture",
            targets: ["ReceiptCapture"]
        )
    ],
    targets: [
        .target(
            name: "ReceiptCapture",
            path: "Sources"
        )
    ]
)
