import AVFoundation
import UIKit

final class NobuRootViewController: UIViewController {
    private let roomImageView = UIImageView(image: UIImage(named: "NobuRoomAlexia"))
    private let characterStage = UIView()
    private let floorShadowView = UIView()
    private let live2DView = NobuLive2DView(character: "Alexia")
    private let openingSpeechSynthesizer = AVSpeechSynthesizer()
    private var roomHotspotButtons: [UIButton] = []
    private var activeSceneAnchor = CGPoint.zero
    private var activeStyleIndex = 0
    private var hasPlayedOpeningGreeting = false

    private struct RoomHotspot {
        let name: String
        let normalizedFrame: CGRect
        let sceneAnchor: CGPoint
        let expression: String?
        let playsMotion: Bool
        let cyclesStyle: Bool
    }

    private let roomHotspots: [RoomHotspot] = [
        RoomHotspot(
            name: "bed",
            normalizedFrame: CGRect(x: 0.00, y: 0.45, width: 0.32, height: 0.45),
            sceneAnchor: CGPoint(x: -0.22, y: 0.03),
            expression: "h",
            playsMotion: false,
            cyclesStyle: false
        ),
        RoomHotspot(
            name: "desk",
            normalizedFrame: CGRect(x: 0.36, y: 0.43, width: 0.36, height: 0.38),
            sceneAnchor: CGPoint(x: 0.02, y: -0.01),
            expression: "mj",
            playsMotion: true,
            cyclesStyle: false
        ),
        RoomHotspot(
            name: "window",
            normalizedFrame: CGRect(x: 0.43, y: 0.12, width: 0.40, height: 0.34),
            sceneAnchor: CGPoint(x: 0.07, y: -0.04),
            expression: "xxy",
            playsMotion: false,
            cyclesStyle: false
        ),
        RoomHotspot(
            name: "wardrobe",
            normalizedFrame: CGRect(x: 0.00, y: 0.12, width: 0.35, height: 0.35),
            sceneAnchor: CGPoint(x: -0.15, y: -0.02),
            expression: nil,
            playsMotion: false,
            cyclesStyle: true
        ),
        RoomHotspot(
            name: "kitchen",
            normalizedFrame: CGRect(x: 0.82, y: 0.39, width: 0.18, height: 0.42),
            sceneAnchor: CGPoint(x: 0.22, y: 0.02),
            expression: "wh",
            playsMotion: false,
            cyclesStyle: false
        )
    ]

    private let characterStyleExpressions = ["yf", "yfmz", "zs1"]

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
        configureRoomEnvironment()
        prepareLive2D()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        positionRoomHotspots()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startOpeningGreetingIfNeeded()
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

    private func configureRoomEnvironment() {
        roomHotspotButtons = roomHotspots.enumerated().map { index, hotspot in
            let button = UIButton(type: .custom)
            button.tag = index
            button.backgroundColor = .clear
            button.accessibilityLabel = "Nobu room \(hotspot.name)"
            button.addTarget(self, action: #selector(roomHotspotPressed(_:)), for: .touchUpInside)
            view.addSubview(button)
            return button
        }

        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(resetRoomFocus))
        tapGesture.numberOfTapsRequired = 2
        tapGesture.cancelsTouchesInView = false
        view.addGestureRecognizer(tapGesture)
    }

    private func positionRoomHotspots() {
        guard let image = roomImageView.image else {
            return
        }

        let imageAspectRatio = image.size.width / image.size.height
        let viewAspectRatio = roomImageView.bounds.width / max(roomImageView.bounds.height, 1)
        let fittedSize: CGSize
        if imageAspectRatio > viewAspectRatio {
            fittedSize = CGSize(width: roomImageView.bounds.height * imageAspectRatio, height: roomImageView.bounds.height)
        } else {
            fittedSize = CGSize(width: roomImageView.bounds.width, height: roomImageView.bounds.width / imageAspectRatio)
        }

        let imageRect = CGRect(
            x: roomImageView.frame.midX - fittedSize.width / 2,
            y: roomImageView.frame.midY - fittedSize.height / 2,
            width: fittedSize.width,
            height: fittedSize.height
        )

        for (index, hotspot) in roomHotspots.enumerated() where index < roomHotspotButtons.count {
            roomHotspotButtons[index].frame = CGRect(
                x: imageRect.minX + imageRect.width * hotspot.normalizedFrame.minX,
                y: imageRect.minY + imageRect.height * hotspot.normalizedFrame.minY,
                width: imageRect.width * hotspot.normalizedFrame.width,
                height: imageRect.height * hotspot.normalizedFrame.height
            )
        }
    }

    @objc private func roomHotspotPressed(_ sender: UIButton) {
        guard sender.tag >= 0, sender.tag < roomHotspots.count else {
            return
        }

        performRoomInteraction(roomHotspots[sender.tag])
    }

    @objc private func resetRoomFocus() {
        setSceneAnchor(.zero)
    }

    private func performRoomInteraction(_ hotspot: RoomHotspot) {
        setSceneAnchor(hotspot.sceneAnchor)

        if hotspot.cyclesStyle {
            cycleCharacterStyle()
        }

        if let expression = hotspot.expression {
            live2DView.playExpression(expression)
        }

        if hotspot.playsMotion {
            live2DView.playMotionGroup("", index: 0)
        }
    }

    private func cycleCharacterStyle() {
        guard !characterStyleExpressions.isEmpty else {
            return
        }

        let expression = characterStyleExpressions[activeStyleIndex % characterStyleExpressions.count]
        activeStyleIndex += 1
        live2DView.playExpression(expression)
    }

    private func setSceneAnchor(_ anchor: CGPoint) {
        activeSceneAnchor = anchor
        let translation = CGAffineTransform(
            translationX: view.bounds.width * anchor.x,
            y: view.bounds.height * anchor.y
        )

        UIView.animate(
            withDuration: 0.45,
            delay: 0,
            usingSpringWithDamping: 0.86,
            initialSpringVelocity: 0.25,
            options: [.allowUserInteraction, .beginFromCurrentState]
        ) {
            self.characterStage.transform = translation
        }
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

    private func startOpeningGreetingIfNeeded() {
        guard !hasPlayedOpeningGreeting else {
            return
        }

        hasPlayedOpeningGreeting = true
        live2DView.playExpression("mj")
        live2DView.playMotionGroup("", index: 0)
        requestMicrophoneReadiness()

        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playAndRecord,
                mode: .spokenAudio,
                options: [.defaultToSpeaker, .allowBluetoothHFP]
            )
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Nobu audio session warning: \(error.localizedDescription)")
        }

        let utterance = AVSpeechUtterance(string: openingGreetingText())
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.92
        utterance.pitchMultiplier = 1.04
        utterance.volume = 0.92
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")

        openingSpeechSynthesizer.speak(utterance)
    }

    private func openingGreetingText() -> String {
        let name = savedUserName()
        let closenessLevel = UserDefaults.standard.integer(forKey: "nobu.closenessLevel")

        if let name, closenessLevel >= 3 {
            return "Hey \(name). I was hoping we would talk today. How are you feeling?"
        }

        if let name {
            return "Hi \(name), how are you today?"
        }

        return "Hi, how are you today?"
    }

    private func savedUserName() -> String? {
        let possibleKeys = [
            "nobu.userName",
            "nobu.username",
            "nobu.displayName",
            "userName",
            "username"
        ]

        for key in possibleKeys {
            let value = UserDefaults.standard.string(forKey: key)?.trimmingCharacters(in: .whitespacesAndNewlines)
            if let value, !value.isEmpty {
                return value
            }
        }

        return nil
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
        if #available(iOS 17.0, *) {
            AVAudioApplication.requestRecordPermission { _ in }
        } else {
            AVAudioSession.sharedInstance().requestRecordPermission { _ in }
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
