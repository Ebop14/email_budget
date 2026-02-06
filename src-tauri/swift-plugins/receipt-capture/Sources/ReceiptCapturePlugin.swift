import UIKit
import Vision
import PhotosUI

/// Result returned to Rust via the Tauri plugin bridge
@objc public class OcrResult: NSObject {
    @objc public let fullText: String
    @objc public let confidence: Double

    init(fullText: String, confidence: Double) {
        self.fullText = fullText
        self.confidence = confidence
    }
}

/// Plugin that captures receipt photos and runs on-device OCR using Apple Vision
@objc public class ReceiptCapturePlugin: NSObject {

    /// Capture a photo from the camera or photo library and run OCR
    @objc public static func captureAndRecognize(
        source: String,
        completion: @escaping (String?, Double, String?) -> Void
    ) {
        DispatchQueue.main.async {
            guard let rootVC = UIApplication.shared
                .connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: { $0.isKeyWindow })?
                .rootViewController else {
                completion(nil, 0, "No root view controller found")
                return
            }

            let coordinator = CaptureCoordinator(completion: completion)

            if source == "camera" {
                guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
                    completion(nil, 0, "Camera not available")
                    return
                }

                let picker = UIImagePickerController()
                picker.sourceType = .camera
                picker.delegate = coordinator
                coordinator.retainSelf = coordinator // prevent dealloc
                rootVC.present(picker, animated: true)
            } else {
                var config = PHPickerConfiguration()
                config.selectionLimit = 1
                config.filter = .images

                let picker = PHPickerViewController(configuration: config)
                picker.delegate = coordinator
                coordinator.retainSelf = coordinator
                rootVC.present(picker, animated: true)
            }
        }
    }

    /// Run OCR on a UIImage using Vision framework
    static func recognizeText(in image: UIImage, completion: @escaping (String?, Double, String?) -> Void) {
        guard let cgImage = image.cgImage else {
            completion(nil, 0, "Failed to get CGImage")
            return
        }

        let request = VNRecognizeTextRequest { request, error in
            if let error = error {
                completion(nil, 0, "OCR failed: \(error.localizedDescription)")
                return
            }

            guard let observations = request.results as? [VNRecognizedTextObservation] else {
                completion(nil, 0, "No text found")
                return
            }

            var lines: [String] = []
            var totalConfidence: Float = 0
            var count: Float = 0

            for observation in observations {
                if let topCandidate = observation.topCandidates(1).first {
                    lines.append(topCandidate.string)
                    totalConfidence += topCandidate.confidence
                    count += 1
                }
            }

            let fullText = lines.joined(separator: "\n")
            let avgConfidence = count > 0 ? Double(totalConfidence / count) : 0

            completion(fullText, avgConfidence, nil)
        }

        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try handler.perform([request])
            } catch {
                completion(nil, 0, "Vision request failed: \(error.localizedDescription)")
            }
        }
    }
}

/// Coordinator that handles image picker callbacks
class CaptureCoordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate, PHPickerViewControllerDelegate {

    let completion: (String?, Double, String?) -> Void
    var retainSelf: CaptureCoordinator?

    init(completion: @escaping (String?, Double, String?) -> Void) {
        self.completion = completion
    }

    // MARK: - UIImagePickerControllerDelegate

    func imagePickerController(
        _ picker: UIImagePickerController,
        didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
    ) {
        picker.dismiss(animated: true)

        guard let image = info[.originalImage] as? UIImage else {
            completion(nil, 0, "No image captured")
            retainSelf = nil
            return
        }

        ReceiptCapturePlugin.recognizeText(in: image) { [weak self] text, confidence, error in
            self?.completion(text, confidence, error)
            self?.retainSelf = nil
        }
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        completion(nil, 0, "Cancelled")
        retainSelf = nil
    }

    // MARK: - PHPickerViewControllerDelegate

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)

        guard let result = results.first else {
            completion(nil, 0, "No image selected")
            retainSelf = nil
            return
        }

        result.itemProvider.loadObject(ofClass: UIImage.self) { [weak self] object, error in
            guard let image = object as? UIImage else {
                self?.completion(nil, 0, error?.localizedDescription ?? "Failed to load image")
                self?.retainSelf = nil
                return
            }

            ReceiptCapturePlugin.recognizeText(in: image) { text, confidence, error in
                self?.completion(text, confidence, error)
                self?.retainSelf = nil
            }
        }
    }
}
