import AVFoundation
import UIKit

final class NobuRootViewController: UIViewController {
    private let roomImageView = UIImageView(image: UIImage(named: "NobuRoomAlexia"))
    private let characterStage = UIView()
    private let statusDot = UIView()
    private let statusLabel = UILabel()

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
        configureVoiceStatus()
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

    private func configureVoiceStatus() {
        statusDot.translatesAutoresizingMaskIntoConstraints = false
        statusDot.backgroundColor = UIColor(red: 0.20, green: 0.76, blue: 0.53, alpha: 1)
        statusDot.layer.cornerRadius = 5

        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.text = "Say Nobu"
        statusLabel.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        statusLabel.textColor = UIColor(red: 0.24, green: 0.22, blue: 0.20, alpha: 0.72)

        let statusStack = UIStackView(arrangedSubviews: [statusDot, statusLabel])
        statusStack.translatesAutoresizingMaskIntoConstraints = false
        statusStack.axis = .horizontal
        statusStack.alignment = .center
        statusStack.spacing = 8
        statusStack.isUserInteractionEnabled = false
        view.addSubview(statusStack)

        NSLayoutConstraint.activate([
            statusDot.widthAnchor.constraint(equalToConstant: 10),
            statusDot.heightAnchor.constraint(equalToConstant: 10),
            statusStack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusStack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24)
        ])
    }

    private func requestMicrophoneReadiness() {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                self?.statusLabel.text = granted ? "Say Nobu" : "Microphone blocked"
            }
        }
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
