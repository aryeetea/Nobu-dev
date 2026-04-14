import AVFoundation
import UIKit

final class NobuRootViewController: UIViewController {
    private let roomImageView = UIImageView(image: UIImage(named: "NobuRoomAlexia"))
    private let characterStage = UIView()
    private let live2DView = NobuLive2DView(character: "Alexia")

    override var prefersStatusBarHidden: Bool {
        false
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
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

        live2DView.translatesAutoresizingMaskIntoConstraints = false
        live2DView.backgroundColor = UIColor.clear
        characterStage.addSubview(live2DView)

        NSLayoutConstraint.activate([
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
