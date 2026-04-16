import AVFoundation
import UIKit

final class NobuRootViewController: UIViewController {
    private let roomEnvironmentView = NobuRoomEnvironmentView()
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

    private let characterStyleExpressions = [
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
    ]

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

        roomEnvironmentView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(roomEnvironmentView)

        NSLayoutConstraint.activate([
            roomEnvironmentView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            roomEnvironmentView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            roomEnvironmentView.topAnchor.constraint(equalTo: view.topAnchor),
            roomEnvironmentView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
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

private final class NobuRoomEnvironmentView: UIView {
    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 0.91, green: 0.97, blue: 0.96, alpha: 1)
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

        drawAmbientBackdrop(in: rect, context: context)
        drawDistantZones(in: rect, context: context)
        drawDepthPath(in: rect, context: context)
        drawSoftForeground(in: rect, context: context)
        drawAtmosphere(in: rect, context: context)
    }

    private func drawAmbientBackdrop(in rect: CGRect, context: CGContext) {
        let colors = [
            UIColor(red: 0.73, green: 0.91, blue: 0.94, alpha: 1).cgColor,
            UIColor(red: 0.93, green: 0.96, blue: 0.89, alpha: 1).cgColor,
            UIColor(red: 1.00, green: 0.82, blue: 0.78, alpha: 1).cgColor
        ] as CFArray
        let locations: [CGFloat] = [0, 0.52, 1]
        if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: locations) {
            context.drawLinearGradient(
                gradient,
                start: CGPoint(x: rect.midX, y: rect.minY),
                end: CGPoint(x: rect.midX, y: rect.maxY),
                options: []
            )
        }

        drawGlow(
            center: CGPoint(x: rect.width * 0.74, y: rect.height * 0.26),
            radius: min(rect.width, rect.height) * 0.34,
            color: UIColor(red: 1.0, green: 0.86, blue: 0.55, alpha: 0.35),
            context: context
        )
        drawGlow(
            center: CGPoint(x: rect.width * 0.18, y: rect.height * 0.42),
            radius: min(rect.width, rect.height) * 0.26,
            color: UIColor(red: 0.50, green: 0.83, blue: 0.74, alpha: 0.28),
            context: context
        )
    }

    private func drawDistantZones(in rect: CGRect, context: CGContext) {
        let horizon = rect.height * 0.50

        UIColor(red: 0.30, green: 0.56, blue: 0.61, alpha: 0.12).setFill()
        let distantCurve = UIBezierPath()
        distantCurve.move(to: CGPoint(x: -rect.width * 0.08, y: horizon))
        distantCurve.addCurve(
            to: CGPoint(x: rect.width * 1.08, y: horizon * 0.94),
            controlPoint1: CGPoint(x: rect.width * 0.22, y: horizon * 0.74),
            controlPoint2: CGPoint(x: rect.width * 0.72, y: horizon * 1.12)
        )
        distantCurve.addLine(to: CGPoint(x: rect.width * 1.08, y: rect.height * 0.68))
        distantCurve.addLine(to: CGPoint(x: -rect.width * 0.08, y: rect.height * 0.68))
        distantCurve.close()
        distantCurve.fill()

        drawRounded(
            CGRect(x: -rect.width * 0.05, y: rect.height * 0.48, width: rect.width * 0.30, height: rect.height * 0.13),
            radius: rect.height * 0.035,
            fill: UIColor(red: 1.0, green: 0.74, blue: 0.73, alpha: 0.26)
        )
        drawRounded(
            CGRect(x: rect.width * 0.06, y: rect.height * 0.56, width: rect.width * 0.20, height: rect.height * 0.035),
            radius: rect.height * 0.018,
            fill: UIColor(red: 1.0, green: 0.95, blue: 0.86, alpha: 0.34)
        )
        drawRounded(
            CGRect(x: rect.width * 0.76, y: rect.height * 0.42, width: rect.width * 0.20, height: rect.height * 0.20),
            radius: rect.height * 0.025,
            fill: UIColor(red: 0.20, green: 0.42, blue: 0.46, alpha: 0.18)
        )
        drawRounded(
            CGRect(x: rect.width * 0.79, y: rect.height * 0.46, width: rect.width * 0.15, height: rect.height * 0.012),
            radius: rect.height * 0.006,
            fill: UIColor(red: 0.95, green: 0.99, blue: 0.90, alpha: 0.45)
        )
        drawRounded(
            CGRect(x: rect.width * 0.79, y: rect.height * 0.50, width: rect.width * 0.10, height: rect.height * 0.012),
            radius: rect.height * 0.006,
            fill: UIColor(red: 0.95, green: 0.99, blue: 0.90, alpha: 0.38)
        )

        drawPlantSilhouette(at: CGPoint(x: rect.width * 0.30, y: rect.height * 0.56), scale: min(rect.width, rect.height) * 0.018)
        drawPlantSilhouette(at: CGPoint(x: rect.width * 0.68, y: rect.height * 0.55), scale: min(rect.width, rect.height) * 0.014)
    }

    private func drawDepthPath(in rect: CGRect, context: CGContext) {
        let floorTop = rect.height * 0.62
        let floorColors = [
            UIColor(red: 0.80, green: 0.91, blue: 0.86, alpha: 0.88).cgColor,
            UIColor(red: 0.96, green: 0.80, blue: 0.70, alpha: 0.82).cgColor
        ] as CFArray
        if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: floorColors, locations: [0, 1]) {
            context.drawLinearGradient(
                gradient,
                start: CGPoint(x: rect.midX, y: floorTop),
                end: CGPoint(x: rect.midX, y: rect.maxY),
                options: []
            )
        }

        let path = UIBezierPath()
        path.move(to: CGPoint(x: rect.width * 0.43, y: floorTop))
        path.addLine(to: CGPoint(x: rect.width * 0.57, y: floorTop))
        path.addLine(to: CGPoint(x: rect.width * 0.78, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.width * 0.22, y: rect.maxY))
        path.close()
        UIColor(red: 1.0, green: 0.96, blue: 0.88, alpha: 0.34).setFill()
        path.fill()

        UIColor(red: 0.31, green: 0.48, blue: 0.49, alpha: 0.12).setStroke()
        for offset in stride(from: -0.34, through: 0.34, by: 0.17) {
            let line = UIBezierPath()
            line.lineWidth = 1.2
            line.move(to: CGPoint(x: rect.midX + rect.width * offset * 0.20, y: floorTop))
            line.addLine(to: CGPoint(x: rect.midX + rect.width * offset, y: rect.maxY))
            line.stroke()
        }

        UIColor(red: 0.21, green: 0.42, blue: 0.43, alpha: 0.10).setStroke()
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

    private func drawSoftForeground(in rect: CGRect, context: CGContext) {
        drawGlow(
            center: CGPoint(x: rect.midX, y: rect.height * 0.82),
            radius: min(rect.width, rect.height) * 0.26,
            color: UIColor(red: 1.0, green: 0.91, blue: 0.70, alpha: 0.20),
            context: context
        )

        UIColor(red: 0.23, green: 0.42, blue: 0.41, alpha: 0.13).setFill()
        UIBezierPath(ovalIn: CGRect(
            x: rect.width * 0.32,
            y: rect.height * 0.83,
            width: rect.width * 0.36,
            height: rect.height * 0.055
        )).fill()
    }

    private func drawAtmosphere(in rect: CGRect, context: CGContext) {
        UIColor(red: 1.0, green: 1.0, blue: 0.96, alpha: 0.48).setFill()
        for index in 0..<18 {
            let progress = CGFloat(index) / 17
            let x = rect.width * (0.08 + 0.84 * progress)
            let y = rect.height * (0.14 + 0.10 * sin(progress * .pi * 2.6))
            drawCircle(center: CGPoint(x: x, y: y), radius: max(2, min(rect.width, rect.height) * 0.0045), fill: UIColor(red: 1.0, green: 1.0, blue: 0.96, alpha: 0.42))
        }

        UIColor(red: 0.22, green: 0.46, blue: 0.48, alpha: 0.12).setStroke()
        let arc = UIBezierPath()
        arc.lineWidth = 2
        arc.move(to: CGPoint(x: rect.width * 0.08, y: rect.height * 0.16))
        arc.addCurve(
            to: CGPoint(x: rect.width * 0.92, y: rect.height * 0.14),
            controlPoint1: CGPoint(x: rect.width * 0.32, y: rect.height * 0.24),
            controlPoint2: CGPoint(x: rect.width * 0.65, y: rect.height * 0.06)
        )
        arc.stroke()
    }

    private func drawPlantSilhouette(at point: CGPoint, scale: CGFloat) {
        UIColor(red: 0.15, green: 0.45, blue: 0.36, alpha: 0.22).setFill()
        let pot = CGRect(x: point.x - scale * 10, y: point.y + scale * 22, width: scale * 20, height: scale * 18)
        UIBezierPath(roundedRect: pot, cornerRadius: scale * 4).fill()

        for index in 0..<7 {
            let angle = CGFloat(index) * .pi / 7 - .pi * 0.9
            let leaf = UIBezierPath(ovalIn: CGRect(
                x: point.x + cos(angle) * scale * 26 - scale * 8,
                y: point.y + sin(angle) * scale * 28 - scale * 12,
                width: scale * 16,
                height: scale * 28
            ))
            leaf.fill()
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
