import AVFoundation
import SceneKit
import Speech
import UIKit

final class NobuRootViewController: UIViewController, AVAudioPlayerDelegate {
    private let roomEnvironmentView = NobuRoomEnvironmentView()
    private let ambientSceneView = SCNView()
    private let ambientScene = SCNScene()
    private let characterStage = UIView()
    private let floorShadowView = UIView()
    private let live2DView = NobuLive2DView(character: "Alexia")
    private let settingsButton = UIButton(type: .system)
    private let settingsHitAreaButton = UIButton(type: .custom)
    private let settingsScrimButton = UIButton(type: .custom)
    private let settingsPanelView = UIView()
    private let settingsScrollView = UIScrollView()
    private let settingsStackView = UIStackView()
    private let profileSummaryLabel = UILabel()
    private let registerEndpointURL = URL(string: "https://heynobu.netlify.app/api/auth/register")!
    private let speechEndpointURL = URL(string: "https://heynobu.netlify.app/api/speech")!
    private let conversationEndpointURL = URL(string: "https://heynobu.netlify.app/api/conversation")!
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var speechRequestTask: URLSessionDataTask?
    private var conversationRequestTask: URLSessionDataTask?
    private var registerRequestTask: URLSessionDataTask?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var listenRestartWorkItem: DispatchWorkItem?
    private var speechAudioPlayer: AVAudioPlayer?
    private var speechMouthDisplayLink: CADisplayLink?
    private var speechMouthPhase: CGFloat = 0
    private var isListeningForUser = false
    private var isSpeechRecognitionAuthorized = false
    private var resumeListeningAfterCurrentSpeech = false
    private var latestRecognizedText = ""
    private var currentCharacter = "Alexia"
    private var roomHotspotButtons: [UIButton] = []
    private var activeSceneAnchor = CGPoint.zero
    private var activeStyleIndex = 0
    private var hasPlayedOpeningGreeting = false
    private var hasPresentedProfileSetup = false

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

    private let characterStyleExpressionsByCharacter = [
        "Alexia": [
            "bbt",
            "dyj",
            "h",
            "k",
            "lh",
            "lzx",
            "mj",
            "sq",
            "wh",
            "xxy",
            "y",
            "yf",
            "yfmz",
            "yjys1",
            "yjys2",
            "zs1"
        ],
        "Asuka": [
            "Gloom",
            "Happy Sparkle",
            "Star Eyes Toggle",
            "Coat Toggle"
        ]
    ]

    deinit {
        speechRequestTask?.cancel()
        conversationRequestTask?.cancel()
        registerRequestTask?.cancel()
        recognitionTask?.cancel()
        audioEngine.stop()
        speechAudioPlayer?.stop()
        speechMouthDisplayLink?.invalidate()
    }

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
        configureAmbientScene()
        configureCharacterStage()
        configureRoomEnvironment()
        configureSettingsPanel()
        configureSettingsShortcut()
        prepareLive2D()
        requestSpeechRecognitionReadiness()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        positionRoomHotspots()
        if settingsPanelView.isHidden {
            view.bringSubviewToFront(settingsButton)
            view.bringSubviewToFront(settingsHitAreaButton)
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if shouldShowProfileSetup() {
            presentProfileSetup()
            return
        }

        startOpeningGreetingIfNeeded()
    }

    private func configureView() {
        view.backgroundColor = UIColor(red: 0.98, green: 0.92, blue: 0.88, alpha: 1)

        roomEnvironmentView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(roomEnvironmentView)

        ambientSceneView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(ambientSceneView)

        NSLayoutConstraint.activate([
            roomEnvironmentView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            roomEnvironmentView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            roomEnvironmentView.topAnchor.constraint(equalTo: view.topAnchor),
            roomEnvironmentView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            ambientSceneView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            ambientSceneView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            ambientSceneView.topAnchor.constraint(equalTo: view.topAnchor),
            ambientSceneView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func configureAmbientScene() {
        ambientSceneView.scene = ambientScene
        ambientSceneView.backgroundColor = .clear
        ambientSceneView.isOpaque = false
        ambientSceneView.allowsCameraControl = false
        ambientSceneView.autoenablesDefaultLighting = false
        ambientSceneView.rendersContinuously = true
        ambientSceneView.preferredFramesPerSecond = 30
        ambientSceneView.isUserInteractionEnabled = false

        let cameraNode = SCNNode()
        cameraNode.camera = SCNCamera()
        cameraNode.camera?.zNear = 0.1
        cameraNode.camera?.zFar = 100
        cameraNode.position = SCNVector3(0, 0, 8)
        ambientScene.rootNode.addChildNode(cameraNode)
        ambientSceneView.pointOfView = cameraNode

        let warmLight = SCNNode()
        warmLight.light = SCNLight()
        warmLight.light?.type = .omni
        warmLight.light?.color = UIColor(red: 1.0, green: 0.82, blue: 0.58, alpha: 1)
        warmLight.light?.intensity = 240
        warmLight.position = SCNVector3(2.8, 2.4, 4)
        ambientScene.rootNode.addChildNode(warmLight)

        let coolLight = SCNNode()
        coolLight.light = SCNLight()
        coolLight.light?.type = .ambient
        coolLight.light?.color = UIColor(red: 0.58, green: 0.86, blue: 0.92, alpha: 1)
        coolLight.light?.intensity = 90
        ambientScene.rootNode.addChildNode(coolLight)

        addAmbientOrbs()
        addDepthRibbons()
    }

    private func addAmbientOrbs() {
        let orbSpecs: [(position: SCNVector3, radius: CGFloat, color: UIColor, delay: TimeInterval)] = [
            (SCNVector3(-2.8, 1.8, -1.8), 0.09, UIColor(red: 1.0, green: 0.78, blue: 0.47, alpha: 0.55), 0),
            (SCNVector3(-1.5, 2.5, -2.7), 0.055, UIColor(red: 0.64, green: 0.92, blue: 0.83, alpha: 0.48), 0.5),
            (SCNVector3(1.7, 1.9, -2.2), 0.075, UIColor(red: 1.0, green: 0.91, blue: 0.62, alpha: 0.52), 1.0),
            (SCNVector3(2.9, 0.9, -2.9), 0.05, UIColor(red: 0.64, green: 0.82, blue: 0.98, alpha: 0.42), 1.5),
            (SCNVector3(-3.2, -0.2, -2.4), 0.065, UIColor(red: 1.0, green: 0.70, blue: 0.76, alpha: 0.36), 0.25),
            (SCNVector3(3.1, -0.4, -2.6), 0.06, UIColor(red: 0.72, green: 0.93, blue: 0.82, alpha: 0.34), 0.8)
        ]

        for spec in orbSpecs {
            let sphere = SCNSphere(radius: spec.radius)
            sphere.segmentCount = 24
            let material = SCNMaterial()
            material.diffuse.contents = spec.color
            material.emission.contents = spec.color.withAlphaComponent(0.72)
            material.transparency = spec.color.cgColor.alpha
            material.isDoubleSided = true
            sphere.materials = [material]

            let node = SCNNode(geometry: sphere)
            node.position = spec.position
            ambientScene.rootNode.addChildNode(node)

            let up = SCNAction.moveBy(x: 0, y: 0.18, z: 0, duration: 2.8)
            up.timingMode = .easeInEaseOut
            let down = up.reversed()
            let float = SCNAction.repeatForever(SCNAction.sequence([up, down]))
            let wait = SCNAction.wait(duration: spec.delay)
            node.runAction(SCNAction.sequence([wait, float]))
        }
    }

    private func addDepthRibbons() {
        let ribbonSpecs: [(position: SCNVector3, size: CGSize, color: UIColor, rotation: Float)] = [
            (SCNVector3(-2.4, -1.05, -3.4), CGSize(width: 1.5, height: 0.08), UIColor(red: 1.0, green: 0.95, blue: 0.78, alpha: 0.20), -0.18),
            (SCNVector3(2.3, -0.72, -3.1), CGSize(width: 1.3, height: 0.07), UIColor(red: 0.66, green: 0.92, blue: 0.86, alpha: 0.18), 0.15),
            (SCNVector3(0, -1.45, -2.8), CGSize(width: 2.2, height: 0.06), UIColor(red: 1.0, green: 0.78, blue: 0.70, alpha: 0.15), 0)
        ]

        for spec in ribbonSpecs {
            let plane = SCNPlane(width: spec.size.width, height: spec.size.height)
            plane.cornerRadius = spec.size.height / 2
            let material = SCNMaterial()
            material.diffuse.contents = spec.color
            material.emission.contents = spec.color.withAlphaComponent(0.55)
            material.transparency = spec.color.cgColor.alpha
            material.isDoubleSided = true
            plane.materials = [material]

            let node = SCNNode(geometry: plane)
            node.position = spec.position
            node.eulerAngles.z = spec.rotation
            ambientScene.rootNode.addChildNode(node)

            let drift = SCNAction.moveBy(x: spec.rotation > 0 ? -0.08 : 0.08, y: 0.04, z: 0, duration: 3.6)
            drift.timingMode = .easeInEaseOut
            node.runAction(SCNAction.repeatForever(SCNAction.sequence([drift, drift.reversed()])))
        }
    }

    private func configureCharacterStage() {
        characterStage.translatesAutoresizingMaskIntoConstraints = false
        characterStage.backgroundColor = UIColor.clear
        view.addSubview(characterStage)

        NSLayoutConstraint.activate([
            characterStage.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            characterStage.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: 18),
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
            floorShadowView.bottomAnchor.constraint(equalTo: characterStage.bottomAnchor, constant: -84),
            floorShadowView.widthAnchor.constraint(equalTo: characterStage.widthAnchor, multiplier: 0.18),
            floorShadowView.heightAnchor.constraint(equalToConstant: 24),

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

        let characterSwitchGesture = UITapGestureRecognizer(target: self, action: #selector(toggleCharacter))
        characterSwitchGesture.numberOfTapsRequired = 3
        characterSwitchGesture.cancelsTouchesInView = false
        view.addGestureRecognizer(characterSwitchGesture)
        tapGesture.require(toFail: characterSwitchGesture)

        let settingsGesture = UILongPressGestureRecognizer(target: self, action: #selector(settingsLongPressed(_:)))
        settingsGesture.minimumPressDuration = 0.75
        settingsGesture.cancelsTouchesInView = false
        view.addGestureRecognizer(settingsGesture)
    }

    private func configureSettingsPanel() {
        settingsScrimButton.translatesAutoresizingMaskIntoConstraints = false
        settingsScrimButton.backgroundColor = UIColor.black.withAlphaComponent(0.18)
        settingsScrimButton.alpha = 0
        settingsScrimButton.isHidden = true
        settingsScrimButton.addTarget(self, action: #selector(closeSettingsPanel), for: .touchUpInside)
        view.addSubview(settingsScrimButton)

        settingsPanelView.translatesAutoresizingMaskIntoConstraints = false
        settingsPanelView.backgroundColor = UIColor.white.withAlphaComponent(0.92)
        settingsPanelView.layer.cornerRadius = 8
        settingsPanelView.layer.shadowColor = UIColor.black.cgColor
        settingsPanelView.layer.shadowOpacity = 0.16
        settingsPanelView.layer.shadowRadius = 24
        settingsPanelView.layer.shadowOffset = CGSize(width: 0, height: 10)
        settingsPanelView.alpha = 0
        settingsPanelView.isHidden = true
        view.addSubview(settingsPanelView)

        settingsScrollView.translatesAutoresizingMaskIntoConstraints = false
        settingsScrollView.alwaysBounceVertical = false
        settingsScrollView.showsVerticalScrollIndicator = false
        settingsPanelView.addSubview(settingsScrollView)

        settingsStackView.translatesAutoresizingMaskIntoConstraints = false
        settingsStackView.axis = .vertical
        settingsStackView.alignment = .fill
        settingsStackView.spacing = 10
        settingsScrollView.addSubview(settingsStackView)

        let titleLabel = UILabel()
        titleLabel.text = "Nobu"
        titleLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        titleLabel.textColor = UIColor(red: 0.16, green: 0.18, blue: 0.20, alpha: 1)

        let detailLabel = UILabel()
        detailLabel.text = "A personal voice AI for memory, notes, planning, organization, reflection, shopping, style, and everyday decisions. ScanFit turns on when you ask about outfits, sizing, shopping, measurements, creator looks, or body changes."
        detailLabel.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        detailLabel.textColor = UIColor(red: 0.40, green: 0.43, blue: 0.46, alpha: 1)
        detailLabel.numberOfLines = 0
        detailLabel.lineBreakMode = .byWordWrapping

        settingsStackView.addArrangedSubview(titleLabel)
        settingsStackView.addArrangedSubview(detailLabel)
        settingsStackView.setCustomSpacing(18, after: detailLabel)

        settingsStackView.addArrangedSubview(makeSettingsSectionLabel("Profile"))
        profileSummaryLabel.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        profileSummaryLabel.textColor = UIColor(red: 0.42, green: 0.43, blue: 0.44, alpha: 1)
        profileSummaryLabel.numberOfLines = 0
        profileSummaryLabel.lineBreakMode = .byWordWrapping
        settingsStackView.addArrangedSubview(profileSummaryLabel)
        updateSettingsProfileSummary()

        settingsStackView.addArrangedSubview(makeSettingsSectionLabel("Character & voice"))
        settingsStackView.addArrangedSubview(makeSettingsButton(
            title: "Use feminine Nobu",
            subtitle: "Alexia model paired with the feminine ElevenLabs voice."
        ) { [weak self] in
            self?.closeSettingsPanel()
            self?.selectCharacter("Alexia", shouldSpeak: true)
        })
        settingsStackView.addArrangedSubview(makeSettingsButton(
            title: "Use masculine Nobu",
            subtitle: "Asuka model paired with the masculine ElevenLabs voice."
        ) { [weak self] in
            self?.closeSettingsPanel()
            self?.selectCharacter("Asuka", shouldSpeak: true)
        })
        settingsStackView.addArrangedSubview(makeSettingsButton(
            title: "Next wardrobe style",
            subtitle: "Cycles the current character's available expressions or toggles."
        ) { [weak self] in
            self?.cycleCharacterStyle()
        })

        settingsStackView.addArrangedSubview(makeSettingsSectionLabel("Conversation"))
        settingsStackView.addArrangedSubview(makeSettingsText("Nobu listens with iOS speech recognition, sends your words to the ElevenLabs agent, then speaks back with the paired Nobu voice."))
        settingsStackView.addArrangedSubview(makeSettingsButton(
            title: "Start listening",
            subtitle: "Use this if you want to manually wake the conversation loop."
        ) { [weak self] in
            self?.closeSettingsPanel()
            self?.beginListeningForUser()
        })
        settingsStackView.addArrangedSubview(makeSettingsButton(
            title: "Exact voice test",
            subtitle: "Tests the selected ElevenLabs Nobu voice."
        ) { [weak self] in
            self?.speakCharacterLine("Hi, I'm Nobu.", resumesListening: false)
        })

        settingsStackView.addArrangedSubview(makeSettingsSectionLabel("Background"))
        settingsStackView.addArrangedSubview(makeSettingsText("The window scene changes by device time: day, evening, or night. It stays lightweight so the Live2D character has room to breathe."))

        settingsStackView.addArrangedSubview(makeSettingsSectionLabel("Quick gestures"))
        settingsStackView.addArrangedSubview(makeSettingsText("Double tap resets Nobu's position. Triple tap switches feminine and masculine Nobu. Long press opens this settings sheet."))

        settingsStackView.setCustomSpacing(16, after: settingsStackView.arrangedSubviews.last ?? detailLabel)
        settingsStackView.addArrangedSubview(makeSettingsButton(title: "Close", subtitle: nil) { [weak self] in
            self?.closeSettingsPanel()
        })

        NSLayoutConstraint.activate([
            settingsScrimButton.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            settingsScrimButton.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            settingsScrimButton.topAnchor.constraint(equalTo: view.topAnchor),
            settingsScrimButton.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            settingsPanelView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 18),
            settingsPanelView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -18),
            settingsPanelView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -18),
            settingsPanelView.heightAnchor.constraint(equalTo: view.safeAreaLayoutGuide.heightAnchor, multiplier: 0.76),

            settingsScrollView.leadingAnchor.constraint(equalTo: settingsPanelView.leadingAnchor),
            settingsScrollView.trailingAnchor.constraint(equalTo: settingsPanelView.trailingAnchor),
            settingsScrollView.topAnchor.constraint(equalTo: settingsPanelView.topAnchor),
            settingsScrollView.bottomAnchor.constraint(equalTo: settingsPanelView.bottomAnchor),

            settingsStackView.leadingAnchor.constraint(equalTo: settingsScrollView.contentLayoutGuide.leadingAnchor, constant: 18),
            settingsStackView.trailingAnchor.constraint(equalTo: settingsScrollView.contentLayoutGuide.trailingAnchor, constant: -18),
            settingsStackView.topAnchor.constraint(equalTo: settingsScrollView.contentLayoutGuide.topAnchor, constant: 18),
            settingsStackView.bottomAnchor.constraint(equalTo: settingsScrollView.contentLayoutGuide.bottomAnchor, constant: -18),
            settingsStackView.widthAnchor.constraint(equalTo: settingsScrollView.frameLayoutGuide.widthAnchor, constant: -36)
        ])
    }

    private func configureSettingsShortcut() {
        settingsButton.translatesAutoresizingMaskIntoConstraints = false
        settingsButton.accessibilityLabel = "Open Nobu settings"
        settingsButton.isUserInteractionEnabled = true
        settingsButton.layer.shadowColor = UIColor.black.cgColor
        settingsButton.layer.shadowOpacity = 0.12
        settingsButton.layer.shadowRadius = 10
        settingsButton.layer.shadowOffset = CGSize(width: 0, height: 4)

        var configuration = UIButton.Configuration.filled()
        configuration.image = UIImage(systemName: "slider.horizontal.3")
        configuration.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(pointSize: 16, weight: .semibold)
        configuration.baseForegroundColor = UIColor(red: 0.20, green: 0.23, blue: 0.25, alpha: 1)
        configuration.baseBackgroundColor = UIColor.white.withAlphaComponent(0.74)
        configuration.cornerStyle = .capsule
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12)
        settingsButton.configuration = configuration
        settingsButton.addTarget(self, action: #selector(openSettingsButtonPressed), for: .touchUpInside)
        view.addSubview(settingsButton)

        settingsHitAreaButton.translatesAutoresizingMaskIntoConstraints = false
        settingsHitAreaButton.backgroundColor = .clear
        settingsHitAreaButton.accessibilityLabel = "Open Nobu settings"
        settingsHitAreaButton.addTarget(self, action: #selector(openSettingsButtonPressed), for: .touchUpInside)
        view.addSubview(settingsHitAreaButton)

        NSLayoutConstraint.activate([
            settingsButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -18),
            settingsButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 22),
            settingsButton.widthAnchor.constraint(equalToConstant: 56),
            settingsButton.heightAnchor.constraint(equalToConstant: 56),

            settingsHitAreaButton.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            settingsHitAreaButton.topAnchor.constraint(equalTo: view.topAnchor),
            settingsHitAreaButton.widthAnchor.constraint(equalToConstant: 120),
            settingsHitAreaButton.heightAnchor.constraint(equalToConstant: 120)
        ])
        view.bringSubviewToFront(settingsButton)
        view.bringSubviewToFront(settingsHitAreaButton)
    }

    private func makeSettingsSectionLabel(_ text: String) -> UILabel {
        let label = UILabel()
        label.text = text.uppercased()
        label.font = UIFont.systemFont(ofSize: 12, weight: .heavy)
        label.textColor = UIColor(red: 0.54, green: 0.38, blue: 0.34, alpha: 1)
        label.numberOfLines = 1
        return label
    }

    private func makeSettingsText(_ text: String) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        label.textColor = UIColor(red: 0.42, green: 0.43, blue: 0.44, alpha: 1)
        label.numberOfLines = 0
        label.lineBreakMode = .byWordWrapping
        return label
    }

    private func makeSettingsButton(title: String, subtitle: String?, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        var titleAttributes = AttributeContainer()
        titleAttributes.font = UIFont.systemFont(ofSize: 16, weight: .bold)

        var configuration = UIButton.Configuration.filled()
        configuration.attributedTitle = AttributedString(title, attributes: titleAttributes)
        if let subtitle {
            var subtitleAttributes = AttributeContainer()
            subtitleAttributes.font = UIFont.systemFont(ofSize: 12, weight: .medium)
            configuration.attributedSubtitle = AttributedString(subtitle, attributes: subtitleAttributes)
        }
        configuration.baseForegroundColor = UIColor(red: 0.18, green: 0.20, blue: 0.22, alpha: 1)
        configuration.baseBackgroundColor = UIColor(red: 0.96, green: 0.91, blue: 0.88, alpha: 1)
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 14, leading: 14, bottom: 14, trailing: 14)
        configuration.titleAlignment = .leading
        configuration.subtitleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var outgoing = incoming
            outgoing.foregroundColor = UIColor(red: 0.44, green: 0.45, blue: 0.46, alpha: 1)
            return outgoing
        }
        button.configuration = configuration
        button.layer.cornerRadius = 8
        button.clipsToBounds = true
        button.addAction(UIAction { _ in action() }, for: .touchUpInside)
        return button
    }

    @objc private func openSettingsButtonPressed() {
        openSettingsPanel()
    }

    @objc private func settingsLongPressed(_ gesture: UILongPressGestureRecognizer) {
        guard gesture.state == .began else {
            return
        }

        openSettingsPanel()
    }

    private func openSettingsPanel() {
        updateSettingsProfileSummary()
        view.bringSubviewToFront(settingsScrimButton)
        view.bringSubviewToFront(settingsPanelView)
        settingsButton.isHidden = true
        settingsHitAreaButton.isHidden = true
        settingsScrimButton.isHidden = false
        settingsPanelView.isHidden = false
        settingsPanelView.transform = CGAffineTransform(translationX: 0, y: 24)

        UIView.animate(withDuration: 0.22, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
            self.settingsScrimButton.alpha = 1
            self.settingsPanelView.alpha = 1
            self.settingsPanelView.transform = .identity
        }
    }

    private func updateSettingsProfileSummary() {
        let name = savedUserName() ?? "Not set"
        let username = UserDefaults.standard.string(forKey: "nobu.username")?.nilIfEmpty ?? "Not set"
        let birthday = savedUserBirthday() ?? "Not set"
        profileSummaryLabel.text = "Name: \(name)\nUsername: \(username)\nBirthday: \(birthday)"
    }

    @objc private func closeSettingsPanel() {
        UIView.animate(withDuration: 0.18, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
            self.settingsScrimButton.alpha = 0
            self.settingsPanelView.alpha = 0
            self.settingsPanelView.transform = CGAffineTransform(translationX: 0, y: 24)
        } completion: { _ in
            self.settingsScrimButton.isHidden = true
            self.settingsPanelView.isHidden = true
            self.settingsButton.isHidden = false
            self.settingsHitAreaButton.isHidden = false
            self.view.bringSubviewToFront(self.settingsButton)
            self.view.bringSubviewToFront(self.settingsHitAreaButton)
            self.settingsPanelView.transform = .identity
        }
    }

    private func positionRoomHotspots() {
        for (index, hotspot) in roomHotspots.enumerated() where index < roomHotspotButtons.count {
            roomHotspotButtons[index].frame = CGRect(
                x: view.bounds.width * hotspot.normalizedFrame.minX,
                y: view.bounds.height * hotspot.normalizedFrame.minY,
                width: view.bounds.width * hotspot.normalizedFrame.width,
                height: view.bounds.height * hotspot.normalizedFrame.height
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

    @objc private func toggleCharacter() {
        let nextCharacter = currentCharacter == "Alexia" ? "Asuka" : "Alexia"
        selectCharacter(nextCharacter, shouldSpeak: true)
    }

    private func selectCharacter(_ character: String, shouldSpeak: Bool) {
        guard character == "Alexia" || character == "Asuka" else {
            return
        }

        stopCurrentSpeech()

        currentCharacter = character
        activeStyleIndex = 0
        roomEnvironmentView.character = currentCharacter
        roomEnvironmentView.setNeedsDisplay()
        live2DView.setCharacter(currentCharacter)

        if currentCharacter == "Asuka" {
            live2DView.playExpression("Happy Sparkle")
            live2DView.playMotionGroup("ANIMATIONS", index: 0)
            if shouldSpeak {
                speakCharacterLine("Hey. I'm here now.", resumesListening: true)
            }
        } else {
            live2DView.playExpression("mj")
            live2DView.playMotionGroup("", index: 0)
            if shouldSpeak {
                speakCharacterLine("Hi. I'm back.", resumesListening: true)
            }
        }
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
            playDefaultCharacterMotion()
        }
    }

    private func playDefaultCharacterMotion() {
        if currentCharacter == "Asuka" {
            live2DView.playMotionGroup("ANIMATIONS", index: 0)
        } else {
            live2DView.playMotionGroup("", index: 0)
        }
    }

    private func cycleCharacterStyle() {
        let characterStyleExpressions = characterStyleExpressionsByCharacter[currentCharacter] ?? []
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

        guard !shouldShowProfileSetup() else {
            presentProfileSetup()
            return
        }

        hasPlayedOpeningGreeting = true
        live2DView.playExpression("mj")
        playDefaultCharacterMotion()
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

        speakCharacterLine(openingGreetingText())
    }

    private func shouldShowProfileSetup() -> Bool {
        savedUserName() == nil || savedUserBirthday() == nil
    }

    private func presentProfileSetup(message: String? = nil) {
        guard !hasPresentedProfileSetup, presentedViewController == nil else {
            return
        }

        hasPresentedProfileSetup = true
        stopCurrentSpeech()

        let setupViewController = SetupViewController()
        setupViewController.onSubmit = { [weak self] profile, setupViewController in
            self?.createNobuProfile(profile, setupViewController: setupViewController)
        }
        if let message {
            setupViewController.loadViewIfNeeded()
            setupViewController.showError(message)
        }

        present(setupViewController, animated: true)
    }

    private func createNobuProfile(_ profile: NobuSetupProfile, setupViewController: SetupViewController) {
        guard !profile.name.isEmpty else {
            setupViewController.showError("Add your name so Nobu knows what to call you.")
            return
        }

        guard profile.username.count >= 3 else {
            setupViewController.showError("Choose a username with at least 3 characters.")
            return
        }

        guard profile.password.count >= 8 else {
            setupViewController.showError("Use a password with at least 8 characters.")
            return
        }

        guard isValidBirthdayString(profile.birthday) else {
            setupViewController.showError("Use your birthday in YYYY-MM-DD format.")
            return
        }

        var request = URLRequest(url: registerEndpointURL)
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "birthday": profile.birthday,
            "name": profile.name,
            "password": profile.password,
            "username": profile.username
        ])

        registerRequestTask = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self else {
                return
            }

            DispatchQueue.main.async {
                self.registerRequestTask = nil

                if let error {
                    setupViewController.showError("Nobu could not create the account yet: \(error.localizedDescription)")
                    return
                }

                if let httpResponse = response as? HTTPURLResponse, !(200..<300).contains(httpResponse.statusCode) {
                    let serverMessage = self.parseServerError(data: data) ?? "Try a different username."
                    setupViewController.showError(serverMessage)
                    return
                }

                UserDefaults.standard.set(profile.name, forKey: "nobu.userName")
                UserDefaults.standard.set(profile.username.lowercased(), forKey: "nobu.username")
                UserDefaults.standard.set(profile.birthday, forKey: "nobu.birthday")
                self.updateSettingsProfileSummary()
                self.hasPresentedProfileSetup = false
                setupViewController.dismiss(animated: true) {
                    self.startOpeningGreetingIfNeeded()
                }
            }
        }
        registerRequestTask?.resume()
    }

    private func speakCharacterLine(_ text: String, resumesListening: Bool = true) {
        stopCurrentSpeech()
        resumeListeningAfterCurrentSpeech = resumesListening

        var request = URLRequest(url: speechEndpointURL)
        request.httpMethod = "POST"
        request.timeoutInterval = 12
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("audio/mpeg", forHTTPHeaderField: "Accept")

        let character = currentCharacterUsesMaleVoice ? "male" : "female"
        let payload = [
            "text": text,
            "character": character
        ]

        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            print("Nobu exact voice request could not be encoded.")
            return
        }

        request.httpBody = body
        speechRequestTask = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self else {
                return
            }

            if let error = error as NSError? {
                if error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled {
                    return
                }

                print("Nobu exact voice request warning: \(error.localizedDescription)")
                return
            }

            guard
                let httpResponse = response as? HTTPURLResponse,
                (200..<300).contains(httpResponse.statusCode),
                let data,
                !data.isEmpty
            else {
                let statusCode = (response as? HTTPURLResponse)?.statusCode ?? -1
                let serverMessage = data.flatMap { String(data: $0, encoding: .utf8) } ?? "No response body."
                print("Nobu exact voice unavailable. Status: \(statusCode). Server: \(serverMessage)")
                return
            }

            DispatchQueue.main.async {
                self.playNobuVoiceAudio(data)
            }
        }
        speechRequestTask?.resume()
    }

    private func stopCurrentSpeech() {
        stopListeningForUser()
        listenRestartWorkItem?.cancel()
        listenRestartWorkItem = nil
        speechRequestTask?.cancel()
        speechRequestTask = nil
        conversationRequestTask?.cancel()
        conversationRequestTask = nil
        speechAudioPlayer?.stop()
        speechAudioPlayer = nil
        stopSpeechMouthMotion()
    }

    private func playNobuVoiceAudio(_ data: Data) {
        do {
            let player = try AVAudioPlayer(data: data)
            player.delegate = self
            player.prepareToPlay()
            speechAudioPlayer = player

            startSpeechMouthMotion()
            player.play()
        } catch {
            print("Nobu exact voice playback warning: \(error.localizedDescription)")
        }
    }

    private var currentCharacterUsesMaleVoice: Bool {
        currentCharacter == "Asuka"
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        speechAudioPlayer = nil
        finishSpeechPlayback()
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        speechAudioPlayer = nil
        finishSpeechPlayback()
    }

    private func finishSpeechPlayback() {
        stopSpeechMouthMotion()
        guard resumeListeningAfterCurrentSpeech else {
            return
        }

        resumeListeningAfterCurrentSpeech = false
        scheduleListeningRestart(after: 0.55)
    }

    private func scheduleListeningRestart(after delay: TimeInterval) {
        listenRestartWorkItem?.cancel()
        let workItem = DispatchWorkItem { [weak self] in
            self?.beginListeningForUser()
        }
        listenRestartWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: workItem)
    }

    private func requestSpeechRecognitionReadiness() {
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                self?.isSpeechRecognitionAuthorized = status == .authorized
                if status != .authorized {
                    print("Nobu speech recognition not authorized: \(status.rawValue)")
                }
            }
        }
    }

    private func beginListeningForUser() {
        guard isSpeechRecognitionAuthorized else {
            requestSpeechRecognitionReadiness()
            print("Nobu cannot listen until speech recognition is authorized.")
            return
        }

        guard speechRecognizer?.isAvailable == true else {
            print("Nobu speech recognizer is unavailable.")
            return
        }

        stopListeningForUser()
        latestRecognizedText = ""

        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playAndRecord,
                mode: .measurement,
                options: [.defaultToSpeaker, .allowBluetoothHFP, .duckOthers]
            )
            try AVAudioSession.sharedInstance().setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            print("Nobu listening audio session warning: \(error.localizedDescription)")
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()

        do {
            try audioEngine.start()
            isListeningForUser = true
        } catch {
            print("Nobu listening start warning: \(error.localizedDescription)")
            stopListeningForUser()
            return
        }

        recognitionTask = speechRecognizer?.recognitionTask(with: request) { [weak self] result, error in
            guard let self else {
                return
            }

            if let result {
                self.latestRecognizedText = result.bestTranscription.formattedString
                if result.isFinal {
                    self.finishUserSpeech()
                }
            }

            if error != nil {
                self.stopListeningForUser()
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 4.6) { [weak self] in
            self?.finishUserSpeech()
        }
    }

    private func finishUserSpeech() {
        guard isListeningForUser else {
            return
        }

        let userText = latestRecognizedText.trimmingCharacters(in: .whitespacesAndNewlines)
        stopListeningForUser()

        guard userText.count >= 2 else {
            scheduleListeningRestart(after: 0.8)
            return
        }

        requestConversationReply(for: userText)
    }

    private func stopListeningForUser() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }

        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        isListeningForUser = false
    }

    private func requestConversationReply(for userText: String) {
        conversationRequestTask?.cancel()

        var request = URLRequest(url: conversationEndpointURL)
        request.httpMethod = "POST"
        request.timeoutInterval = 18
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = [
            "birthday": savedUserBirthday() ?? "",
            "message": userText,
            "userName": savedUserName() ?? "",
            "character": currentCharacterUsesMaleVoice ? "male" : "female"
        ]

        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            speakCharacterLine("I heard you, but I could not shape my answer yet.")
            return
        }

        request.httpBody = body
        conversationRequestTask = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self else {
                return
            }

            if let error = error as NSError? {
                if error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled {
                    return
                }

                print("Nobu conversation request warning: \(error.localizedDescription)")
            }

            if let httpResponse = response as? HTTPURLResponse, !(200..<300).contains(httpResponse.statusCode) {
                let serverMessage = data.flatMap { String(data: $0, encoding: .utf8) } ?? "No response body."
                print("Nobu conversation request failed. Status: \(httpResponse.statusCode). Server: \(serverMessage)")
                return
            }

            guard let reply = self.parseConversationReply(data: data) else {
                let serverMessage = data.flatMap { String(data: $0, encoding: .utf8) } ?? "No response body."
                print("Nobu conversation reply missing. Server: \(serverMessage)")
                return
            }

            DispatchQueue.main.async {
                self.speakCharacterLine(reply, resumesListening: true)
            }
        }
        conversationRequestTask?.resume()
    }

    private func parseConversationReply(data: Data?) -> String? {
        guard
            let data,
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let reply = object["reply"] as? String
        else {
            return nil
        }

        let trimmed = reply.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func startSpeechMouthMotion() {
        speechMouthDisplayLink?.invalidate()
        speechMouthPhase = 0

        let displayLink = CADisplayLink(target: self, selector: #selector(updateSpeechMouthMotion))
        displayLink.preferredFramesPerSecond = 30
        displayLink.add(to: .main, forMode: .common)
        speechMouthDisplayLink = displayLink
    }

    private func stopSpeechMouthMotion() {
        speechMouthDisplayLink?.invalidate()
        speechMouthDisplayLink = nil
        live2DView.setLipSyncValue(0)
    }

    @objc private func updateSpeechMouthMotion() {
        speechMouthPhase += 0.42
        let primary = (sin(speechMouthPhase) + 1) * 0.5
        let secondary = (sin(speechMouthPhase * 2.7 + 0.8) + 1) * 0.5
        let value = 0.08 + primary * 0.50 + secondary * 0.24
        live2DView.setLipSyncValue(value)
    }

    private func openingGreetingText() -> String {
        let name = savedUserName()
        let closenessLevel = UserDefaults.standard.integer(forKey: "nobu.closenessLevel")

        if let name, isBirthdayToday(savedUserBirthday()) {
            return "Happy birthday, \(name). I hope today feels soft and special. How are you feeling?"
        }

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

    private func savedUserBirthday() -> String? {
        UserDefaults.standard.string(forKey: "nobu.birthday")?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
    }

    private func isValidBirthdayString(_ birthday: String) -> Bool {
        let parts = birthday.split(separator: "-")
        guard parts.count == 3,
              let year = Int(parts[0]),
              let month = Int(parts[1]),
              let day = Int(parts[2]),
              year >= 1900,
              month >= 1,
              month <= 12,
              day >= 1,
              day <= 31
        else {
            return false
        }

        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.year = year
        components.month = month
        components.day = day
        guard let date = components.date else {
            return false
        }

        return date <= Date()
    }

    private func isBirthdayToday(_ birthday: String?) -> Bool {
        guard let birthday else {
            return false
        }

        let parts = birthday.split(separator: "-")
        guard parts.count == 3,
              let month = Int(parts[1]),
              let day = Int(parts[2])
        else {
            return false
        }

        let today = Calendar.current.dateComponents([.month, .day], from: Date())
        return today.month == month && today.day == day
    }

    private func parseServerError(data: Data?) -> String? {
        guard
            let data,
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let error = object["error"] as? String,
            !error.isEmpty
        else {
            return nil
        }

        return error
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

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}

private final class NobuRoomEnvironmentView: UIView {
    private enum TimeScene {
        case day
        case evening
        case night
    }

    var character = "Alexia" {
        didSet {
            if oldValue != character {
                setNeedsDisplay()
            }
        }
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 0.96, green: 0.94, blue: 0.92, alpha: 1)
        isUserInteractionEnabled = false
        contentMode = .redraw
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        nil
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else {
            return
        }

        let scene = currentTimeScene()
        if let roomImage = bundledRoomImage(for: scene) {
            drawAspectFill(roomImage, in: rect)
            return
        }

        let expectedAssetName = character == "Asuka" ? "NobuRoomAsuka" : "NobuRoomAlexia"
        print("Missing room asset \(expectedAssetName)")
        drawWall(in: rect, scene: scene, context: context)
        drawWindow(in: rect, scene: scene, context: context)
        drawFloor(in: rect, scene: scene, context: context)
        drawSoftForeground(in: rect, scene: scene, context: context)
    }

    private func currentTimeScene() -> TimeScene {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour >= 19 || hour < 6 {
            return .night
        }

        if hour >= 16 {
            return .evening
        }

        return .day
    }

    private func bundledRoomImage(for scene: TimeScene) -> UIImage? {
        if character == "Asuka" {
            return UIImage(named: "NobuRoomAsuka")
        }

        return UIImage(named: "NobuRoomAlexia")
    }

    private func drawAspectFill(_ image: UIImage, in rect: CGRect) {
        let imageSize = image.size
        guard imageSize.width > 0, imageSize.height > 0 else {
            return
        }

        let scale = max(rect.width / imageSize.width, rect.height / imageSize.height)
        let drawSize = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
        let drawRect = CGRect(
            x: rect.midX - drawSize.width / 2,
            y: rect.midY - drawSize.height / 2,
            width: drawSize.width,
            height: drawSize.height
        )
        image.draw(in: drawRect)
    }

    private func drawWall(in rect: CGRect, scene: TimeScene, context: CGContext) {
        let colors: [CGColor]
        switch scene {
        case .day:
            colors = [
                UIColor(red: 0.98, green: 0.94, blue: 0.91, alpha: 1).cgColor,
                UIColor(red: 0.91, green: 0.96, blue: 0.95, alpha: 1).cgColor
            ]
        case .evening:
            colors = [
                UIColor(red: 0.98, green: 0.89, blue: 0.86, alpha: 1).cgColor,
                UIColor(red: 0.86, green: 0.89, blue: 0.94, alpha: 1).cgColor
            ]
        case .night:
            colors = [
                UIColor(red: 0.16, green: 0.18, blue: 0.25, alpha: 1).cgColor,
                UIColor(red: 0.09, green: 0.12, blue: 0.18, alpha: 1).cgColor
            ]
        }

        if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors as CFArray, locations: [0, 1]) {
            context.drawLinearGradient(
                gradient,
                start: CGPoint(x: rect.midX, y: rect.minY),
                end: CGPoint(x: rect.midX, y: rect.maxY),
                options: []
            )
        }

        let lineColor = scene == .night
            ? UIColor(red: 0.95, green: 0.90, blue: 0.80, alpha: 0.10)
            : UIColor(red: 0.50, green: 0.35, blue: 0.30, alpha: 0.13)
        lineColor.setStroke()
        let trim = UIBezierPath()
        trim.lineWidth = 2
        trim.move(to: CGPoint(x: 0, y: rect.height * 0.12))
        trim.addLine(to: CGPoint(x: rect.width, y: rect.height * 0.08))
        trim.stroke()

        drawStringLights(in: rect, scene: scene)
    }

    private func drawWindow(in rect: CGRect, scene: TimeScene, context: CGContext) {
        let windowRect = CGRect(
            x: rect.width * 0.12,
            y: rect.height * 0.10,
            width: rect.width * 0.76,
            height: rect.height * 0.46
        )
        let frameColor = scene == .night
            ? UIColor(red: 0.34, green: 0.26, blue: 0.27, alpha: 1)
            : UIColor(red: 0.62, green: 0.43, blue: 0.34, alpha: 1)

        drawRounded(windowRect.insetBy(dx: -8, dy: -8), radius: 18, fill: frameColor.withAlphaComponent(0.26))
        drawRounded(windowRect, radius: 16, fill: frameColor)

        let glassRect = windowRect.insetBy(dx: 12, dy: 12)
        context.saveGState()
        UIBezierPath(roundedRect: glassRect, cornerRadius: 10).addClip()
        drawSky(in: glassRect, scene: scene, context: context)
        drawViewLayers(in: glassRect, scene: scene)
        context.restoreGState()

        frameColor.setFill()
        let mullionWidth = max(5, rect.width * 0.007)
        UIBezierPath(roundedRect: CGRect(x: glassRect.midX - mullionWidth / 2, y: glassRect.minY, width: mullionWidth, height: glassRect.height), cornerRadius: mullionWidth / 2).fill()
        UIBezierPath(roundedRect: CGRect(x: glassRect.minX, y: glassRect.midY - mullionWidth / 2, width: glassRect.width, height: mullionWidth), cornerRadius: mullionWidth / 2).fill()

        drawCurtains(around: windowRect, scene: scene)
        drawWindowShelf(under: windowRect, scene: scene)
    }

    private func drawSky(in rect: CGRect, scene: TimeScene, context: CGContext) {
        let colors = [
            skyTopColor(for: scene).cgColor,
            skyBottomColor(for: scene).cgColor
        ] as CFArray
        if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1]) {
            context.drawLinearGradient(
                gradient,
                start: CGPoint(x: rect.midX, y: rect.minY),
                end: CGPoint(x: rect.midX, y: rect.maxY),
                options: []
            )
        }

        switch scene {
        case .day:
            drawCircle(center: CGPoint(x: rect.maxX - rect.width * 0.20, y: rect.minY + rect.height * 0.20), radius: min(rect.width, rect.height) * 0.12, fill: UIColor(red: 1.0, green: 0.86, blue: 0.42, alpha: 0.92))
            drawCloud(at: CGPoint(x: rect.minX + rect.width * 0.24, y: rect.minY + rect.height * 0.25), scale: rect.width * 0.10, color: UIColor.white.withAlphaComponent(0.72))
            drawCloud(at: CGPoint(x: rect.minX + rect.width * 0.70, y: rect.minY + rect.height * 0.34), scale: rect.width * 0.08, color: UIColor.white.withAlphaComponent(0.52))
        case .evening:
            drawCircle(center: CGPoint(x: rect.maxX - rect.width * 0.18, y: rect.minY + rect.height * 0.28), radius: min(rect.width, rect.height) * 0.10, fill: UIColor(red: 1.0, green: 0.66, blue: 0.46, alpha: 0.82))
            drawCloud(at: CGPoint(x: rect.minX + rect.width * 0.30, y: rect.minY + rect.height * 0.30), scale: rect.width * 0.11, color: UIColor(red: 1.0, green: 0.85, blue: 0.78, alpha: 0.55))
        case .night:
            drawCircle(center: CGPoint(x: rect.maxX - rect.width * 0.20, y: rect.minY + rect.height * 0.20), radius: min(rect.width, rect.height) * 0.10, fill: UIColor(red: 0.96, green: 0.92, blue: 0.76, alpha: 0.88))
            drawCircle(center: CGPoint(x: rect.maxX - rect.width * 0.16, y: rect.minY + rect.height * 0.17), radius: min(rect.width, rect.height) * 0.10, fill: skyTopColor(for: scene))
            for index in 0..<18 {
                let progress = CGFloat(index) / 18
                drawCircle(
                    center: CGPoint(x: rect.minX + rect.width * (0.08 + progress * 0.82), y: rect.minY + rect.height * (0.12 + 0.30 * abs(sin(progress * 7.1)))),
                    radius: 1.5 + CGFloat(index % 3),
                    fill: UIColor.white.withAlphaComponent(0.62)
                )
            }
        }
    }

    private func drawViewLayers(in rect: CGRect, scene: TimeScene) {
        let farColor = scene == .night
            ? UIColor(red: 0.18, green: 0.22, blue: 0.31, alpha: 0.74)
            : UIColor(red: 0.54, green: 0.70, blue: 0.72, alpha: 0.34)
        farColor.setFill()
        let hills = UIBezierPath()
        hills.move(to: CGPoint(x: rect.minX, y: rect.maxY * 0.74))
        hills.addCurve(
            to: CGPoint(x: rect.maxX, y: rect.maxY * 0.70),
            controlPoint1: CGPoint(x: rect.minX + rect.width * 0.28, y: rect.maxY * 0.56),
            controlPoint2: CGPoint(x: rect.minX + rect.width * 0.66, y: rect.maxY * 0.82)
        )
        hills.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        hills.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        hills.close()
        hills.fill()

        let buildingColor = scene == .night
            ? UIColor(red: 0.08, green: 0.11, blue: 0.17, alpha: 0.55)
            : UIColor(red: 0.66, green: 0.77, blue: 0.80, alpha: 0.34)
        for index in 0..<7 {
            let width = rect.width * CGFloat([0.12, 0.08, 0.10, 0.15, 0.09, 0.12, 0.07][index])
            let height = rect.height * CGFloat([0.22, 0.16, 0.28, 0.20, 0.25, 0.18, 0.23][index])
            let x = rect.minX + rect.width * CGFloat(index) * 0.15
            let building = CGRect(x: x, y: rect.maxY - height, width: width, height: height)
            drawRounded(building, radius: 2, fill: buildingColor)
        }
    }

    private func drawFloor(in rect: CGRect, scene: TimeScene, context: CGContext) {
        let floorTop = rect.height * 0.64
        let floorColors = [
            floorTopColor(for: scene).cgColor,
            floorBottomColor(for: scene).cgColor
        ] as CFArray
        if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: floorColors, locations: [0, 1]) {
            context.drawLinearGradient(
                gradient,
                start: CGPoint(x: rect.midX, y: floorTop),
                end: CGPoint(x: rect.midX, y: rect.maxY),
                options: []
            )
        }

        let lineColor = scene == .night
            ? UIColor(red: 0.90, green: 0.82, blue: 0.70, alpha: 0.10)
            : UIColor(red: 0.48, green: 0.31, blue: 0.22, alpha: 0.14)
        lineColor.setStroke()
        for offset in stride(from: -0.42, through: 0.42, by: 0.14) {
            let line = UIBezierPath()
            line.lineWidth = 1
            line.move(to: CGPoint(x: rect.midX + rect.width * offset * 0.20, y: floorTop))
            line.addLine(to: CGPoint(x: rect.midX + rect.width * offset, y: rect.maxY))
            line.stroke()
        }

        for index in 0..<4 {
            let y = floorTop + (rect.maxY - floorTop) * CGFloat(index + 1) / 5
            let line = UIBezierPath()
            line.lineWidth = 1
            line.move(to: CGPoint(x: rect.width * 0.12, y: y))
            line.addCurve(
                to: CGPoint(x: rect.width * 0.88, y: y + rect.height * 0.012),
                controlPoint1: CGPoint(x: rect.width * 0.34, y: y - rect.height * 0.02),
                controlPoint2: CGPoint(x: rect.width * 0.66, y: y + rect.height * 0.025)
            )
            line.stroke()
        }
    }

    private func drawSoftForeground(in rect: CGRect, scene: TimeScene, context: CGContext) {
        let rugColor = scene == .night
            ? UIColor(red: 0.78, green: 0.72, blue: 0.66, alpha: 0.16)
            : UIColor(red: 1.0, green: 0.93, blue: 0.78, alpha: 0.42)
        drawRounded(
            CGRect(x: rect.width * 0.26, y: rect.height * 0.84, width: rect.width * 0.48, height: rect.height * 0.13),
            radius: rect.height * 0.06,
            fill: rugColor
        )

        drawGlow(
            center: CGPoint(x: rect.midX, y: rect.height * 0.79),
            radius: min(rect.width, rect.height) * 0.26,
            color: scene == .night
                ? UIColor(red: 0.52, green: 0.68, blue: 0.95, alpha: 0.15)
                : UIColor(red: 1.0, green: 0.88, blue: 0.58, alpha: 0.20),
            context: context
        )
    }

    private func drawStringLights(in rect: CGRect, scene: TimeScene) {
        let cordColor = scene == .night
            ? UIColor(red: 0.98, green: 0.84, blue: 0.58, alpha: 0.38)
            : UIColor(red: 0.50, green: 0.36, blue: 0.32, alpha: 0.24)
        cordColor.setStroke()
        let arc = UIBezierPath()
        arc.lineWidth = 1.6
        arc.move(to: CGPoint(x: rect.width * 0.08, y: rect.height * 0.16))
        arc.addCurve(
            to: CGPoint(x: rect.width * 0.92, y: rect.height * 0.15),
            controlPoint1: CGPoint(x: rect.width * 0.34, y: rect.height * 0.21),
            controlPoint2: CGPoint(x: rect.width * 0.64, y: rect.height * 0.09)
        )
        arc.stroke()

        for index in 0..<10 {
            let progress = CGFloat(index) / 9
            let x = rect.width * (0.10 + progress * 0.80)
            let y = rect.height * (0.16 + 0.035 * sin(progress * .pi * 2.0))
            let bulbColor = scene == .night
                ? UIColor(red: 1.0, green: 0.82, blue: 0.42, alpha: 0.88)
                : UIColor(red: 1.0, green: 0.74, blue: 0.42, alpha: 0.42)
            drawCircle(center: CGPoint(x: x, y: y), radius: 3.5, fill: bulbColor)
        }
    }

    private func drawCurtains(around rect: CGRect, scene: TimeScene) {
        let curtainColor = scene == .night
            ? UIColor(red: 0.80, green: 0.72, blue: 0.78, alpha: 0.50)
            : UIColor(red: 0.95, green: 0.84, blue: 0.82, alpha: 0.54)
        curtainColor.setFill()

        for side in [0, 1] {
            let x = side == 0 ? rect.minX - rect.width * 0.08 : rect.maxX - rect.width * 0.04
            let curtain = UIBezierPath()
            curtain.move(to: CGPoint(x: x, y: rect.minY - rect.height * 0.04))
            curtain.addCurve(
                to: CGPoint(x: x + rect.width * 0.08, y: rect.maxY + rect.height * 0.07),
                controlPoint1: CGPoint(x: x + rect.width * 0.05, y: rect.midY),
                controlPoint2: CGPoint(x: x - rect.width * 0.03, y: rect.maxY)
            )
            curtain.addLine(to: CGPoint(x: x + rect.width * 0.18, y: rect.maxY + rect.height * 0.04))
            curtain.addCurve(
                to: CGPoint(x: x + rect.width * 0.10, y: rect.minY - rect.height * 0.02),
                controlPoint1: CGPoint(x: x + rect.width * 0.12, y: rect.maxY * 0.78),
                controlPoint2: CGPoint(x: x + rect.width * 0.16, y: rect.midY)
            )
            curtain.close()
            curtain.fill()
        }
    }

    private func drawWindowShelf(under rect: CGRect, scene: TimeScene) {
        let shelfColor = scene == .night
            ? UIColor(red: 0.40, green: 0.29, blue: 0.28, alpha: 0.92)
            : UIColor(red: 0.64, green: 0.43, blue: 0.31, alpha: 0.92)
        drawRounded(
            CGRect(x: rect.minX + rect.width * 0.10, y: rect.maxY + 8, width: rect.width * 0.80, height: 12),
            radius: 6,
            fill: shelfColor
        )

        drawPlant(at: CGPoint(x: rect.midX - rect.width * 0.20, y: rect.maxY + 4), scale: rect.width * 0.020, scene: scene)
        drawPlant(at: CGPoint(x: rect.midX + rect.width * 0.22, y: rect.maxY + 5), scale: rect.width * 0.016, scene: scene)
    }

    private func drawCloud(at point: CGPoint, scale: CGFloat, color: UIColor) {
        color.setFill()
        drawCircle(center: CGPoint(x: point.x - scale * 0.42, y: point.y + scale * 0.08), radius: scale * 0.34, fill: color)
        drawCircle(center: CGPoint(x: point.x, y: point.y - scale * 0.08), radius: scale * 0.46, fill: color)
        drawCircle(center: CGPoint(x: point.x + scale * 0.48, y: point.y + scale * 0.10), radius: scale * 0.30, fill: color)
        drawRounded(CGRect(x: point.x - scale * 0.62, y: point.y, width: scale * 1.24, height: scale * 0.36), radius: scale * 0.18, fill: color)
    }

    private func drawPlant(at point: CGPoint, scale: CGFloat, scene: TimeScene) {
        let leafColor = scene == .night
            ? UIColor(red: 0.33, green: 0.51, blue: 0.41, alpha: 0.70)
            : UIColor(red: 0.32, green: 0.61, blue: 0.42, alpha: 0.78)
        let potColor = scene == .night
            ? UIColor(red: 0.50, green: 0.35, blue: 0.32, alpha: 0.80)
            : UIColor(red: 0.72, green: 0.45, blue: 0.32, alpha: 0.84)

        drawRounded(CGRect(x: point.x - scale * 8, y: point.y + scale * 12, width: scale * 16, height: scale * 12), radius: scale * 3, fill: potColor)
        leafColor.setFill()
        for index in 0..<6 {
            let angle = CGFloat(index) * .pi / 6 - .pi * 0.9
            UIBezierPath(ovalIn: CGRect(
                x: point.x + cos(angle) * scale * 14 - scale * 4,
                y: point.y + sin(angle) * scale * 14 - scale * 7,
                width: scale * 8,
                height: scale * 15
            )).fill()
        }
    }

    private func skyTopColor(for scene: TimeScene) -> UIColor {
        switch scene {
        case .day:
            return UIColor(red: 0.65, green: 0.86, blue: 0.96, alpha: 1)
        case .evening:
            return UIColor(red: 0.58, green: 0.62, blue: 0.84, alpha: 1)
        case .night:
            return UIColor(red: 0.08, green: 0.12, blue: 0.24, alpha: 1)
        }
    }

    private func skyBottomColor(for scene: TimeScene) -> UIColor {
        switch scene {
        case .day:
            return UIColor(red: 0.86, green: 0.95, blue: 0.99, alpha: 1)
        case .evening:
            return UIColor(red: 0.98, green: 0.62, blue: 0.52, alpha: 1)
        case .night:
            return UIColor(red: 0.17, green: 0.20, blue: 0.34, alpha: 1)
        }
    }

    private func floorTopColor(for scene: TimeScene) -> UIColor {
        switch scene {
        case .day:
            return UIColor(red: 0.82, green: 0.70, blue: 0.56, alpha: 0.88)
        case .evening:
            return UIColor(red: 0.72, green: 0.55, blue: 0.48, alpha: 0.88)
        case .night:
            return UIColor(red: 0.22, green: 0.20, blue: 0.24, alpha: 0.92)
        }
    }

    private func floorBottomColor(for scene: TimeScene) -> UIColor {
        switch scene {
        case .day:
            return UIColor(red: 0.74, green: 0.55, blue: 0.38, alpha: 0.90)
        case .evening:
            return UIColor(red: 0.55, green: 0.38, blue: 0.33, alpha: 0.92)
        case .night:
            return UIColor(red: 0.12, green: 0.12, blue: 0.16, alpha: 0.96)
        }
    }

    private func drawGlow(center: CGPoint, radius: CGFloat, color: UIColor, context: CGContext) {
        let colors = [
            color.cgColor,
            color.withAlphaComponent(0).cgColor
        ] as CFArray
        guard let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1]) else {
            return
        }
        context.drawRadialGradient(
            gradient,
            startCenter: center,
            startRadius: 0,
            endCenter: center,
            endRadius: radius,
            options: [.drawsAfterEndLocation]
        )
    }

    private func drawRounded(_ rect: CGRect, radius: CGFloat, fill: UIColor) {
        fill.setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: radius).fill()
    }

    private func drawCircle(center: CGPoint, radius: CGFloat, fill: UIColor, stroke: UIColor? = nil, lineWidth: CGFloat = 1) {
        let path = UIBezierPath(ovalIn: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2))
        fill.setFill()
        path.fill()
        if let stroke {
            stroke.setStroke()
            path.lineWidth = lineWidth
            path.stroke()
        }
    }
}
