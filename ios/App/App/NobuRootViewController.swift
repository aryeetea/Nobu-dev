import AVFoundation
import UIKit

final class NobuRootViewController: UIViewController {
    private let roomImageView = UIImageView(image: UIImage(named: "NobuRoomAlexia"))
    private let characterStage = UIView()

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
