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
        backgroundColor = UIColor(red: 0.98, green: 0.92, blue: 0.89, alpha: 1)
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

        let scale = RoomScale(rect)
        drawWall(in: rect)
        drawStringLights(in: rect, scale: scale)
        drawWindow(in: rect, scale: scale)
        drawShelves(in: rect, scale: scale)
        drawBed(in: rect, scale: scale)
        drawDesk(in: rect, scale: scale)
        drawChair(in: rect, scale: scale)
        drawKitchen(in: rect, scale: scale)
        drawFloor(in: rect, context: context)
    }

    private func drawWall(in rect: CGRect) {
        UIColor(red: 0.98, green: 0.91, blue: 0.89, alpha: 1).setFill()
        UIRectFill(rect)

        UIColor(red: 0.74, green: 0.54, blue: 0.47, alpha: 1).setStroke()
        let trim = UIBezierPath()
        trim.lineWidth = 3
        trim.move(to: CGPoint(x: 0, y: rect.height * 0.08))
        trim.addLine(to: CGPoint(x: rect.width, y: rect.height * 0.04))
        trim.stroke()
    }

    private func drawFloor(in rect: CGRect, context: CGContext) {
        let floorTop = rect.height * 0.76
        UIColor(red: 0.78, green: 0.58, blue: 0.42, alpha: 1).setFill()
        UIRectFill(CGRect(x: 0, y: floorTop, width: rect.width, height: rect.height - floorTop))

        UIColor(red: 0.58, green: 0.39, blue: 0.27, alpha: 0.34).setStroke()
        for index in 0...12 {
            let x = CGFloat(index) * rect.width / 9
            let plank = UIBezierPath()
            plank.lineWidth = 1.2
            plank.move(to: CGPoint(x: x, y: floorTop))
            plank.addLine(to: CGPoint(x: x - rect.width * 0.12, y: rect.height))
            plank.stroke()
        }

        let rugRect = CGRect(x: rect.width * 0.25, y: rect.height * 0.84, width: rect.width * 0.50, height: rect.height * 0.16)
        context.saveGState()
        let rugPath = UIBezierPath(roundedRect: rugRect, cornerRadius: rugRect.height * 0.45)
        UIColor(red: 0.96, green: 0.88, blue: 0.78, alpha: 0.82).setFill()
        rugPath.fill()
        UIColor(red: 0.72, green: 0.53, blue: 0.42, alpha: 0.2).setStroke()
        rugPath.lineWidth = 2
        rugPath.stroke()
        context.restoreGState()
    }

    private func drawStringLights(in rect: CGRect, scale: RoomScale) {
        let cord = UIBezierPath()
        cord.lineWidth = 2
        UIColor(red: 0.56, green: 0.38, blue: 0.32, alpha: 0.55).setStroke()
        cord.move(to: CGPoint(x: -20, y: scale.y(118)))
        cord.addCurve(
            to: CGPoint(x: scale.x(990), y: scale.y(105)),
            controlPoint1: CGPoint(x: scale.x(260), y: scale.y(210)),
            controlPoint2: CGPoint(x: scale.x(640), y: scale.y(35))
        )
        cord.stroke()

        for index in 0..<12 {
            let progress = CGFloat(index) / 11
            let x = progress * rect.width
            let y = scale.y(106) + sin(progress * .pi * 2) * scale.unit * 17
            drawCircle(center: CGPoint(x: x, y: y), radius: scale.unit * 5, fill: UIColor(red: 1.0, green: 0.74, blue: 0.36, alpha: 0.82))
        }
    }

    private func drawWindow(in rect: CGRect, scale: RoomScale) {
        let frame = CGRect(x: scale.x(470), y: scale.y(130), width: scale.w(390), height: scale.h(285))
        let windowPath = UIBezierPath(roundedRect: frame, cornerRadius: 14 * scale.unit)
        UIColor(red: 0.72, green: 0.90, blue: 0.96, alpha: 1).setFill()
        windowPath.fill()
        UIColor(red: 0.60, green: 0.40, blue: 0.31, alpha: 1).setStroke()
        windowPath.lineWidth = 5 * scale.unit
        windowPath.stroke()

        UIColor(red: 0.53, green: 0.75, blue: 0.76, alpha: 0.35).setFill()
        UIBezierPath(ovalIn: CGRect(x: frame.minX + frame.width * 0.03, y: frame.maxY - frame.height * 0.23, width: frame.width * 0.62, height: frame.height * 0.23)).fill()
        UIBezierPath(ovalIn: CGRect(x: frame.midX, y: frame.maxY - frame.height * 0.18, width: frame.width * 0.45, height: frame.height * 0.16)).fill()

        UIColor(red: 0.58, green: 0.40, blue: 0.33, alpha: 1).setStroke()
        for x in [frame.midX, frame.minX + frame.width * 0.66] {
            let divider = UIBezierPath()
            divider.lineWidth = 4 * scale.unit
            divider.move(to: CGPoint(x: x, y: frame.minY))
            divider.addLine(to: CGPoint(x: x, y: frame.maxY))
            divider.stroke()
        }
        let horizontal = UIBezierPath()
        horizontal.lineWidth = 4 * scale.unit
        horizontal.move(to: CGPoint(x: frame.minX, y: frame.midY))
        horizontal.addLine(to: CGPoint(x: frame.maxX, y: frame.midY))
        horizontal.stroke()

        drawCurtain(CGRect(x: frame.minX - scale.w(74), y: frame.minY - scale.h(50), width: scale.w(95), height: scale.h(335)), scale: scale, mirrored: false)
        drawCurtain(CGRect(x: frame.maxX - scale.w(18), y: frame.minY - scale.h(50), width: scale.w(95), height: scale.h(335)), scale: scale, mirrored: true)

        drawPlant(pot: CGRect(x: frame.minX + frame.width * 0.36, y: frame.minY + frame.height * 0.52, width: scale.w(38), height: scale.h(42)), scale: scale)
        drawPlant(pot: CGRect(x: frame.minX + frame.width * 0.52, y: frame.minY + frame.height * 0.58, width: scale.w(31), height: scale.h(34)), scale: scale)
        drawPencilCup(CGRect(x: frame.minX + frame.width * 0.66, y: frame.minY + frame.height * 0.55, width: scale.w(45), height: scale.h(64)), scale: scale)
    }

    private func drawCurtain(_ rect: CGRect, scale: RoomScale, mirrored: Bool) {
        UIColor(red: 0.96, green: 0.89, blue: 0.84, alpha: 0.9).setFill()
        UIColor(red: 0.62, green: 0.44, blue: 0.38, alpha: 0.6).setStroke()
        let path = UIBezierPath()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + rect.height * 0.05))
        path.addCurve(
            to: CGPoint(x: mirrored ? rect.maxX : rect.minX, y: rect.maxY),
            controlPoint1: CGPoint(x: rect.midX + (mirrored ? 48 : -48) * scale.unit, y: rect.minY + rect.height * 0.28),
            controlPoint2: CGPoint(x: rect.midX + (mirrored ? -24 : 24) * scale.unit, y: rect.minY + rect.height * 0.75)
        )
        path.addCurve(
            to: CGPoint(x: rect.minX, y: rect.minY),
            controlPoint1: CGPoint(x: rect.midX, y: rect.maxY - 34 * scale.unit),
            controlPoint2: CGPoint(x: rect.minX, y: rect.minY + 70 * scale.unit)
        )
        path.close()
        path.fill()
        path.lineWidth = 2 * scale.unit
        path.stroke()
    }

    private func drawShelves(in rect: CGRect, scale: RoomScale) {
        drawShelf(CGRect(x: scale.x(45), y: scale.y(150), width: scale.w(250), height: scale.h(16)), scale: scale)
        drawShelf(CGRect(x: scale.x(190), y: scale.y(280), width: scale.w(285), height: scale.h(16)), scale: scale)

        for index in 0..<6 {
            let bookRect = CGRect(x: scale.x(58 + CGFloat(index) * 24), y: scale.y(103 + CGFloat(index % 2) * 8), width: scale.w(16), height: scale.h(47))
            UIColor(hue: 0.08 + CGFloat(index) * 0.06, saturation: 0.35, brightness: 0.84, alpha: 1).setFill()
            UIBezierPath(roundedRect: bookRect, cornerRadius: 2 * scale.unit).fill()
        }

        drawPlant(pot: CGRect(x: scale.x(118), y: scale.y(170), width: scale.w(45), height: scale.h(42)), scale: scale)
        drawPegBoard(CGRect(x: scale.x(180), y: scale.y(318), width: scale.w(260), height: scale.h(145)), scale: scale)
        drawPoster(CGRect(x: scale.x(64), y: scale.y(292), width: scale.w(92), height: scale.h(132)), scale: scale)
        drawCat(at: CGPoint(x: scale.x(402), y: scale.y(444)), scale: scale)
    }

    private func drawShelf(_ rect: CGRect, scale: RoomScale) {
        UIColor(red: 0.56, green: 0.33, blue: 0.23, alpha: 1).setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: 2 * scale.unit).fill()
        UIColor(red: 0.39, green: 0.23, blue: 0.17, alpha: 0.55).setFill()
        UIRectFill(CGRect(x: rect.minX, y: rect.maxY - 3 * scale.unit, width: rect.width, height: 3 * scale.unit))
    }

    private func drawPegBoard(_ rect: CGRect, scale: RoomScale) {
        UIColor(red: 0.86, green: 0.69, blue: 0.54, alpha: 1).setFill()
        UIColor(red: 0.50, green: 0.33, blue: 0.25, alpha: 0.7).setStroke()
        let board = UIBezierPath(roundedRect: rect, cornerRadius: 5 * scale.unit)
        board.fill()
        board.lineWidth = 2 * scale.unit
        board.stroke()

        UIColor(red: 0.54, green: 0.39, blue: 0.32, alpha: 0.38).setFill()
        for row in 0..<5 {
            for column in 0..<9 {
                drawCircle(
                    center: CGPoint(x: rect.minX + CGFloat(column) * rect.width / 8, y: rect.minY + CGFloat(row) * rect.height / 4),
                    radius: 1.4 * scale.unit,
                    fill: UIColor(red: 0.54, green: 0.39, blue: 0.32, alpha: 0.38)
                )
            }
        }
    }

    private func drawPoster(_ rect: CGRect, scale: RoomScale) {
        UIColor(red: 0.26, green: 0.25, blue: 0.23, alpha: 1).setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: 3 * scale.unit).fill()
        UIColor.white.setFill()
        "BANDS".draw(
            in: CGRect(x: rect.minX + scale.w(10), y: rect.minY + scale.h(14), width: rect.width - scale.w(20), height: scale.h(24)),
            withAttributes: [.font: UIFont.boldSystemFont(ofSize: 16 * scale.unit), .foregroundColor: UIColor.white]
        )
    }

    private func drawBed(in rect: CGRect, scale: RoomScale) {
        let bedBase = CGRect(x: scale.x(-25), y: scale.y(625), width: scale.w(430), height: scale.h(170))
        UIColor(red: 0.66, green: 0.43, blue: 0.31, alpha: 1).setFill()
        UIBezierPath(roundedRect: bedBase, cornerRadius: 18 * scale.unit).fill()
        UIColor(red: 0.97, green: 0.87, blue: 0.84, alpha: 1).setFill()
        UIBezierPath(roundedRect: bedBase.insetBy(dx: 0, dy: 16 * scale.unit), cornerRadius: 28 * scale.unit).fill()
        UIColor(red: 0.92, green: 0.69, blue: 0.70, alpha: 1).setFill()
        UIBezierPath(roundedRect: CGRect(x: scale.x(45), y: scale.y(548), width: scale.w(245), height: scale.h(92)), cornerRadius: 18 * scale.unit).fill()
        UIColor(red: 0.98, green: 0.84, blue: 0.76, alpha: 1).setFill()
        UIBezierPath(roundedRect: CGRect(x: scale.x(100), y: scale.y(595), width: scale.w(245), height: scale.h(78)), cornerRadius: 17 * scale.unit).fill()
        drawCat(at: CGPoint(x: scale.x(94), y: scale.y(704)), scale: scale)
    }

    private func drawDesk(in rect: CGRect, scale: RoomScale) {
        let top = CGRect(x: scale.x(480), y: scale.y(548), width: scale.w(360), height: scale.h(22))
        UIColor(red: 0.61, green: 0.38, blue: 0.25, alpha: 1).setFill()
        UIBezierPath(roundedRect: top, cornerRadius: 6 * scale.unit).fill()
        UIRectFill(CGRect(x: top.minX + scale.w(35), y: top.maxY, width: scale.w(18), height: scale.h(175)))
        UIRectFill(CGRect(x: top.maxX - scale.w(42), y: top.maxY, width: scale.w(18), height: scale.h(175)))

        UIColor(red: 0.24, green: 0.25, blue: 0.25, alpha: 1).setFill()
        UIBezierPath(roundedRect: CGRect(x: scale.x(650), y: scale.y(470), width: scale.w(190), height: scale.h(92)), cornerRadius: 6 * scale.unit).fill()
        UIColor(red: 0.77, green: 0.88, blue: 0.89, alpha: 1).setFill()
        UIBezierPath(roundedRect: CGRect(x: scale.x(505), y: scale.y(505), width: scale.w(145), height: scale.h(72)), cornerRadius: 5 * scale.unit).fill()
        drawCat(at: CGPoint(x: scale.x(715), y: scale.y(560)), scale: scale)
    }

    private func drawChair(in rect: CGRect, scale: RoomScale) {
        UIColor(red: 0.94, green: 0.67, blue: 0.70, alpha: 1).setFill()
        UIBezierPath(roundedRect: CGRect(x: scale.x(365), y: scale.y(590), width: scale.w(140), height: scale.h(100)), cornerRadius: 18 * scale.unit).fill()
        UIColor(red: 0.97, green: 0.77, blue: 0.78, alpha: 1).setFill()
        UIBezierPath(roundedRect: CGRect(x: scale.x(330), y: scale.y(675), width: scale.w(210), height: scale.h(52)), cornerRadius: 22 * scale.unit).fill()
        UIColor(red: 0.62, green: 0.45, blue: 0.40, alpha: 1).setStroke()
        let stand = UIBezierPath()
        stand.lineWidth = 4 * scale.unit
        stand.move(to: CGPoint(x: scale.x(435), y: scale.y(727)))
        stand.addLine(to: CGPoint(x: scale.x(435), y: scale.y(805)))
        stand.move(to: CGPoint(x: scale.x(390), y: scale.y(805)))
        stand.addLine(to: CGPoint(x: scale.x(480), y: scale.y(805)))
        stand.stroke()
    }

    private func drawKitchen(in rect: CGRect, scale: RoomScale) {
        UIColor(red: 0.96, green: 0.78, blue: 0.58, alpha: 1).setFill()
        UIBezierPath(roundedRect: CGRect(x: scale.x(905), y: scale.y(545), width: scale.w(135), height: scale.h(260)), cornerRadius: 8 * scale.unit).fill()
        UIColor(red: 0.40, green: 0.25, blue: 0.20, alpha: 1).setStroke()
        let stove = UIBezierPath(roundedRect: CGRect(x: scale.x(930), y: scale.y(582), width: scale.w(96), height: scale.h(58)), cornerRadius: 5 * scale.unit)
        stove.lineWidth = 2 * scale.unit
        stove.stroke()
        drawCircle(center: CGPoint(x: scale.x(955), y: scale.y(608)), radius: scale.unit * 14, fill: UIColor.clear, stroke: UIColor(red: 0.39, green: 0.25, blue: 0.21, alpha: 1), lineWidth: 2 * scale.unit)
        drawCircle(center: CGPoint(x: scale.x(1000), y: scale.y(608)), radius: scale.unit * 14, fill: UIColor.clear, stroke: UIColor(red: 0.39, green: 0.25, blue: 0.21, alpha: 1), lineWidth: 2 * scale.unit)
        drawShelf(CGRect(x: scale.x(920), y: scale.y(178), width: scale.w(150), height: scale.h(14)), scale: scale)
        drawShelf(CGRect(x: scale.x(920), y: scale.y(268), width: scale.w(150), height: scale.h(14)), scale: scale)
    }

    private func drawPlant(pot: CGRect, scale: RoomScale) {
        UIColor(red: 0.71, green: 0.42, blue: 0.27, alpha: 1).setFill()
        UIBezierPath(roundedRect: pot, cornerRadius: 4 * scale.unit).fill()
        UIColor(red: 0.38, green: 0.59, blue: 0.32, alpha: 1).setFill()
        for index in 0..<7 {
            let angle = CGFloat(index) * .pi / 6 - .pi / 2
            let leaf = UIBezierPath(ovalIn: CGRect(
                x: pot.midX + cos(angle) * pot.width * 0.46 - scale.w(8),
                y: pot.minY + sin(angle) * pot.height * 0.8 - scale.h(12),
                width: scale.w(18),
                height: scale.h(28)
            ))
            leaf.fill()
        }
    }

    private func drawPencilCup(_ rect: CGRect, scale: RoomScale) {
        UIColor(red: 0.92, green: 0.74, blue: 0.68, alpha: 1).setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: 4 * scale.unit).fill()
        UIColor(red: 0.46, green: 0.29, blue: 0.22, alpha: 1).setStroke()
        for index in 0..<5 {
            let pencil = UIBezierPath()
            pencil.lineWidth = 2 * scale.unit
            let x = rect.minX + CGFloat(index + 1) * rect.width / 6
            pencil.move(to: CGPoint(x: x, y: rect.minY))
            pencil.addLine(to: CGPoint(x: x + CGFloat(index - 2) * scale.unit * 3, y: rect.minY - scale.h(52)))
            pencil.stroke()
        }
    }

    private func drawCat(at point: CGPoint, scale: RoomScale) {
        UIColor(red: 0.98, green: 0.92, blue: 0.84, alpha: 1).setFill()
        let body = UIBezierPath(roundedRect: CGRect(x: point.x, y: point.y, width: scale.w(58), height: scale.h(34)), cornerRadius: 16 * scale.unit)
        body.fill()
        let head = UIBezierPath(roundedRect: CGRect(x: point.x + scale.w(44), y: point.y - scale.h(10), width: scale.w(32), height: scale.h(30)), cornerRadius: 12 * scale.unit)
        head.fill()
        let ear = UIBezierPath()
        ear.move(to: CGPoint(x: point.x + scale.w(50), y: point.y - scale.h(6)))
        ear.addLine(to: CGPoint(x: point.x + scale.w(58), y: point.y - scale.h(22)))
        ear.addLine(to: CGPoint(x: point.x + scale.w(65), y: point.y - scale.h(5)))
        ear.close()
        ear.fill()
        UIColor(red: 0.46, green: 0.31, blue: 0.27, alpha: 0.8).setStroke()
        let tail = UIBezierPath()
        tail.lineWidth = 3 * scale.unit
        tail.move(to: CGPoint(x: point.x + scale.w(4), y: point.y + scale.h(16)))
        tail.addCurve(to: CGPoint(x: point.x - scale.w(22), y: point.y + scale.h(10)), controlPoint1: CGPoint(x: point.x - scale.w(8), y: point.y + scale.h(28)), controlPoint2: CGPoint(x: point.x - scale.w(25), y: point.y + scale.h(24)))
        tail.stroke()
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

    private struct RoomScale {
        let rect: CGRect
        let unit: CGFloat

        init(_ rect: CGRect) {
            self.rect = rect
            self.unit = min(rect.width / 1080, rect.height / 900)
        }

        func x(_ value: CGFloat) -> CGFloat { rect.midX - 540 * unit + value * unit }
        func y(_ value: CGFloat) -> CGFloat { rect.midY - 450 * unit + value * unit }
        func w(_ value: CGFloat) -> CGFloat { value * unit }
        func h(_ value: CGFloat) -> CGFloat { value * unit }
    }
}
