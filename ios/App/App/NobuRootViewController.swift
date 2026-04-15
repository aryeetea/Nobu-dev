import AVFoundation
import UIKit

final class NobuRootViewController: UIViewController {
    private let roomImageView = UIImageView(image: UIImage(named: "NobuRoomAlexia"))
    private let characterStage = UIView()
    private let floorShadowView = UIView()
    private let live2DView = NobuLive2DView(character: "Alexia")

    override var prefersStatusBarHidden: Bool {
        true
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
    }

    override var prefersHomeIndicatorAutoHidden: Bool {
        true
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        configureView()
        configureCharacterStage()
        prepareLive2D()
        requestMicrophoneReadiness()
        requestCameraReadiness()
    }

    private func configureView() {
        view.backgroundColor = UIColor(red: 0.98, green: 0.92, blue: 0.88, alpha: 1)

        roomImageView.translatesAutoresizingMaskIntoConstraints = false
        roomImageView.contentMode = .scaleAspectFill
        roomImageView.clipsToBounds = true
        view.addSubview(roomImageView)

        NSLayoutConstraint.activate([
            roomImageView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            roomImageView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            roomImageView.topAnchor.constraint(equalTo: view.topAnchor),
            roomImageView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func configureCharacterStage() {
        characterStage.translatesAutoresizingMaskIntoConstraints = false
        characterStage.backgroundColor = UIColor.clear
        view.addSubview(characterStage)

        NSLayoutConstraint.activate([
            characterStage.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            characterStage.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -68),
            characterStage.widthAnchor.constraint(equalTo: view.widthAnchor),
            characterStage.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.72)
        ])

        floorShadowView.translatesAutoresizingMaskIntoConstraints = false
        floorShadowView.backgroundColor = UIColor.black.withAlphaComponent(0.16)
        floorShadowView.layer.cornerRadius = 16
        floorShadowView.layer.shadowColor = UIColor.black.cgColor
        floorShadowView.layer.shadowOpacity = 0.18
        floorShadowView.layer.shadowRadius = 14
        floorShadowView.layer.shadowOffset = CGSize(width: 0, height: 4)
        characterStage.addSubview(floorShadowView)

        live2DView.translatesAutoresizingMaskIntoConstraints = false
        live2DView.backgroundColor = UIColor.clear
        characterStage.addSubview(live2DView)

        NSLayoutConstraint.activate([
            floorShadowView.centerXAnchor.constraint(equalTo: characterStage.centerXAnchor),
            floorShadowView.bottomAnchor.constraint(equalTo: characterStage.bottomAnchor, constant: -22),
            floorShadowView.widthAnchor.constraint(equalTo: characterStage.widthAnchor, multiplier: 0.16),
            floorShadowView.heightAnchor.constraint(equalToConstant: 32),

            live2DView.leadingAnchor.constraint(equalTo: characterStage.leadingAnchor),
            live2DView.trailingAnchor.constraint(equalTo: characterStage.trailingAnchor),
            live2DView.topAnchor.constraint(equalTo: characterStage.topAnchor),
            live2DView.bottomAnchor.constraint(equalTo: characterStage.bottomAnchor)
        ])
    }

    private func prepareLive2D() {
        let coreVersion = NobuLive2DBridge.coreVersionString()
        let alexiaPath = NobuLive2DBridge.bundledModelPath(forCharacter: "Alexia") ?? "missing"
        var errorMessage: NSString?
        let alexiaReadable = NobuLive2DBridge.bundledMocIsReadable(forCharacter: "Alexia", errorMessage: &errorMessage)

        print("Nobu Live2D Cubism Core \(coreVersion)")
        print("Nobu Alexia model path: \(alexiaPath)")
        print("Nobu Alexia moc readable: \(alexiaReadable) \(errorMessage ?? "")")
        printLive2DShaderBundleStatus()
    }

    private func printLive2DShaderBundleStatus() {
        guard let shaderDirectory = Bundle.main.resourceURL?.appendingPathComponent("FrameworkMetallibs") else {
            print("Nobu Live2D shader directory missing")
            return
        }

        let shaderFiles = (try? FileManager.default.contentsOfDirectory(
            at: shaderDirectory,
            includingPropertiesForKeys: nil
        )) ?? []
        let metallibCount = shaderFiles.filter { $0.pathExtension == "metallib" }.count
        let metalShadersExists = FileManager.default.fileExists(
            atPath: shaderDirectory.appendingPathComponent("MetalShaders.metallib").path
        )
        let blendShaderExists = FileManager.default.fileExists(
            atPath: shaderDirectory.appendingPathComponent("FragShaderSrcBlendAddOver.metallib").path
        )

        print("Nobu Live2D shader dir: \(shaderDirectory.path)")
        print("Nobu Live2D metallib count: \(metallibCount)")
        print("Nobu Live2D MetalShaders exists: \(metalShadersExists)")
        print("Nobu Live2D blend shader exists: \(blendShaderExists)")
    }

    private func requestMicrophoneReadiness() {
        AVAudioSession.sharedInstance().requestRecordPermission { _ in }
    }

    private func requestCameraReadiness() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized, .denied, .restricted:
            break
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { _ in }
        @unknown default:
            break
        }
    }
}
