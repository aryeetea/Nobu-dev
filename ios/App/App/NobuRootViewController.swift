import AVFoundation
import UIKit

final class NobuRootViewController: UIViewController {
    private let roomView = NobuAnimeRoomView()
    private let characterStage = UIView()
    private let statusDot = UIView()
    private let statusLabel = UILabel()
    private let voiceButton = UIButton(type: .system)
    private let cameraButton = UIButton(type: .system)
    private let settingsButton = UIButton(type: .system)

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
        configureControls()
        requestMicrophoneReadiness()
    }

    private func configureView() {
        view.backgroundColor = UIColor(red: 0.97, green: 0.91, blue: 0.86, alpha: 1)

        roomView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(roomView)

        NSLayoutConstraint.activate([
            roomView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            roomView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            roomView.topAnchor.constraint(equalTo: view.topAnchor),
            roomView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func configureCharacterStage() {
        characterStage.translatesAutoresizingMaskIntoConstraints = false
        characterStage.backgroundColor = UIColor.clear
        characterStage.layer.cornerRadius = 18
        characterStage.layer.borderWidth = 1
        characterStage.layer.borderColor = UIColor.white.withAlphaComponent(0.34).cgColor
        view.addSubview(characterStage)

        let glow = UIView()
        glow.translatesAutoresizingMaskIntoConstraints = false
        glow.backgroundColor = UIColor(red: 1.0, green: 0.78, blue: 0.67, alpha: 0.18)
        glow.layer.cornerRadius = 120
        characterStage.addSubview(glow)

        let placeholder = UILabel()
        placeholder.translatesAutoresizingMaskIntoConstraints = false
        placeholder.text = "Live2D native layer"
        placeholder.textAlignment = .center
        placeholder.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        placeholder.textColor = UIColor(red: 0.28, green: 0.22, blue: 0.20, alpha: 0.52)
        characterStage.addSubview(placeholder)

        NSLayoutConstraint.activate([
            characterStage.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            characterStage.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -82),
            characterStage.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.62),
            characterStage.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.52),

            glow.centerXAnchor.constraint(equalTo: characterStage.centerXAnchor),
            glow.centerYAnchor.constraint(equalTo: characterStage.centerYAnchor, constant: 24),
            glow.widthAnchor.constraint(equalToConstant: 240),
            glow.heightAnchor.constraint(equalToConstant: 240),

            placeholder.centerXAnchor.constraint(equalTo: characterStage.centerXAnchor),
            placeholder.centerYAnchor.constraint(equalTo: characterStage.centerYAnchor)
        ])
    }

    private func configureControls() {
        statusDot.translatesAutoresizingMaskIntoConstraints = false
        statusDot.backgroundColor = UIColor(red: 0.20, green: 0.76, blue: 0.53, alpha: 1)
        statusDot.layer.cornerRadius = 5

        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.text = "Nobu is native"
        statusLabel.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        statusLabel.textColor = UIColor(red: 0.24, green: 0.22, blue: 0.20, alpha: 0.72)

        let statusStack = UIStackView(arrangedSubviews: [statusDot, statusLabel])
        statusStack.translatesAutoresizingMaskIntoConstraints = false
        statusStack.axis = .horizontal
        statusStack.alignment = .center
        statusStack.spacing = 8
        view.addSubview(statusStack)

        configurePillButton(voiceButton, title: "Voice", systemImage: "mic.fill")
        configurePillButton(cameraButton, title: "Camera", systemImage: "camera.fill")
        configurePillButton(settingsButton, title: "Nobu", systemImage: "slider.horizontal.3")

        voiceButton.addTarget(self, action: #selector(handleVoiceTap), for: .touchUpInside)
        cameraButton.addTarget(self, action: #selector(handleCameraTap), for: .touchUpInside)

        let controlStack = UIStackView(arrangedSubviews: [voiceButton, cameraButton, settingsButton])
        controlStack.translatesAutoresizingMaskIntoConstraints = false
        controlStack.axis = .horizontal
        controlStack.alignment = .center
        controlStack.distribution = .fillEqually
        controlStack.spacing = 10
        view.addSubview(controlStack)

        NSLayoutConstraint.activate([
            statusDot.widthAnchor.constraint(equalToConstant: 10),
            statusDot.heightAnchor.constraint(equalToConstant: 10),
            statusStack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusStack.bottomAnchor.constraint(equalTo: controlStack.topAnchor, constant: -18),

            controlStack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 18),
            controlStack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -18),
            controlStack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -18),
            controlStack.heightAnchor.constraint(equalToConstant: 48)
        ])
    }

    private func configurePillButton(_ button: UIButton, title: String, systemImage: String) {
        var configuration = UIButton.Configuration.filled()
        configuration.title = title
        configuration.image = UIImage(systemName: systemImage)
        configuration.imagePadding = 7
        configuration.baseBackgroundColor = UIColor.white.withAlphaComponent(0.72)
        configuration.baseForegroundColor = UIColor(red: 0.26, green: 0.23, blue: 0.21, alpha: 0.86)
        configuration.cornerStyle = .capsule
        button.configuration = configuration
        button.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        button.layer.shadowColor = UIColor.black.cgColor
        button.layer.shadowOpacity = 0.08
        button.layer.shadowRadius = 12
        button.layer.shadowOffset = CGSize(width: 0, height: 6)
    }

    private func requestMicrophoneReadiness() {
        AVAudioSession.sharedInstance().requestRecordPermission { _ in }
    }

    @objc private func handleVoiceTap() {
        statusLabel.text = "Voice engine next"
    }

    @objc private func handleCameraTap() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            statusLabel.text = "Camera ready"
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    self?.statusLabel.text = granted ? "Camera ready" : "Camera blocked"
                }
            }
        default:
            statusLabel.text = "Camera blocked"
        }
    }
}

final class NobuAnimeRoomView: UIView {
    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = false
        contentMode = .redraw
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        isUserInteractionEnabled = false
        contentMode = .redraw
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }

        drawWall(in: rect, context: context)
        drawWindow(in: rect)
        drawBed(in: rect)
        drawDesk(in: rect)
        drawShelves(in: rect)
        drawFloor(in: rect, context: context)
        drawPlants(in: rect)
        drawStringLights(in: rect)
    }

    private func drawWall(in rect: CGRect, context: CGContext) {
        let colors = [
            UIColor(red: 0.99, green: 0.89, blue: 0.88, alpha: 1).cgColor,
            UIColor(red: 0.89, green: 0.95, blue: 0.95, alpha: 1).cgColor
        ]
        let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors as CFArray, locations: [0, 1])!
        context.drawLinearGradient(
            gradient,
            start: CGPoint(x: rect.midX, y: 0),
            end: CGPoint(x: rect.midX, y: rect.maxY * 0.72),
            options: []
        )
    }

    private func drawWindow(in rect: CGRect) {
        let windowRect = CGRect(x: rect.width * 0.18, y: rect.height * 0.11, width: rect.width * 0.64, height: rect.height * 0.28)
        rounded(windowRect, radius: 18, fill: UIColor(red: 0.79, green: 0.93, blue: 0.98, alpha: 1))
        rounded(windowRect.insetBy(dx: 8, dy: 8), radius: 14, fill: UIColor(red: 0.67, green: 0.88, blue: 0.96, alpha: 1))

        UIColor.white.withAlphaComponent(0.82).setFill()
        UIRectFill(CGRect(x: windowRect.midX - 2, y: windowRect.minY + 8, width: 4, height: windowRect.height - 16))
        UIRectFill(CGRect(x: windowRect.minX + 8, y: windowRect.midY - 2, width: windowRect.width - 16, height: 4))

        let hills = UIBezierPath()
        hills.move(to: CGPoint(x: windowRect.minX + 8, y: windowRect.maxY - 28))
        hills.addCurve(
            to: CGPoint(x: windowRect.maxX - 8, y: windowRect.maxY - 36),
            controlPoint1: CGPoint(x: windowRect.midX - 60, y: windowRect.maxY - 84),
            controlPoint2: CGPoint(x: windowRect.midX + 80, y: windowRect.maxY - 2)
        )
        hills.addLine(to: CGPoint(x: windowRect.maxX - 8, y: windowRect.maxY - 8))
        hills.addLine(to: CGPoint(x: windowRect.minX + 8, y: windowRect.maxY - 8))
        hills.close()
        UIColor(red: 0.54, green: 0.70, blue: 0.64, alpha: 0.72).setFill()
        hills.fill()
    }

    private func drawBed(in rect: CGRect) {
        let bed = CGRect(x: rect.width * 0.04, y: rect.height * 0.57, width: rect.width * 0.48, height: rect.height * 0.18)
        rounded(bed, radius: 24, fill: UIColor(red: 1.0, green: 0.91, blue: 0.88, alpha: 0.94))
        rounded(CGRect(x: bed.minX, y: bed.midY, width: bed.width, height: bed.height * 0.58), radius: 20, fill: UIColor(red: 0.94, green: 0.64, blue: 0.76, alpha: 0.82))
        rounded(CGRect(x: bed.minX + 22, y: bed.minY + 14, width: bed.width * 0.22, height: 42), radius: 10, fill: UIColor(red: 1.0, green: 0.87, blue: 0.58, alpha: 1))
        rounded(CGRect(x: bed.minX + bed.width * 0.36, y: bed.minY + 20, width: bed.width * 0.38, height: 36), radius: 10, fill: UIColor(red: 0.82, green: 0.66, blue: 0.76, alpha: 0.7))
    }

    private func drawDesk(in rect: CGRect) {
        let deskTop = CGRect(x: rect.width * 0.50, y: rect.height * 0.62, width: rect.width * 0.42, height: 18)
        rounded(deskTop, radius: 7, fill: UIColor(red: 0.63, green: 0.46, blue: 0.25, alpha: 1))

        UIColor(red: 0.55, green: 0.39, blue: 0.22, alpha: 1).setFill()
        UIRectFill(CGRect(x: deskTop.minX + 18, y: deskTop.maxY, width: 10, height: rect.height * 0.16))
        UIRectFill(CGRect(x: deskTop.maxX - 28, y: deskTop.maxY, width: 10, height: rect.height * 0.16))

        let monitor = CGRect(x: deskTop.minX + 34, y: deskTop.minY - 74, width: deskTop.width * 0.44, height: 56)
        rounded(monitor, radius: 10, fill: UIColor(red: 0.15, green: 0.29, blue: 0.31, alpha: 1))
        rounded(CGRect(x: monitor.minX + 14, y: monitor.minY + 16, width: monitor.width * 0.68, height: 6), radius: 3, fill: UIColor(red: 0.77, green: 0.82, blue: 0.70, alpha: 1))
        rounded(CGRect(x: monitor.minX + 14, y: monitor.minY + 32, width: monitor.width * 0.48, height: 6), radius: 3, fill: UIColor(red: 0.77, green: 0.82, blue: 0.70, alpha: 1))

        let chair = CGRect(x: rect.width * 0.64, y: rect.height * 0.67, width: rect.width * 0.18, height: rect.height * 0.13)
        rounded(chair, radius: 18, fill: UIColor(red: 0.18, green: 0.37, blue: 0.36, alpha: 1))
        rounded(CGRect(x: chair.minX + 12, y: chair.midY, width: chair.width - 24, height: 38), radius: 7, fill: UIColor(red: 0.56, green: 0.31, blue: 0.48, alpha: 1))
    }

    private func drawShelves(in rect: CGRect) {
        let shelf = CGRect(x: rect.width * 0.06, y: rect.height * 0.19, width: rect.width * 0.28, height: 8)
        UIColor(red: 0.64, green: 0.39, blue: 0.27, alpha: 1).setFill()
        UIRectFill(shelf)
        UIRectFill(shelf.offsetBy(dx: rect.width * 0.58, dy: -16))

        let bookColors = [
            UIColor(red: 0.94, green: 0.54, blue: 0.65, alpha: 1),
            UIColor(red: 0.98, green: 0.77, blue: 0.47, alpha: 1),
            UIColor(red: 0.31, green: 0.63, blue: 0.56, alpha: 1),
            UIColor(red: 0.28, green: 0.36, blue: 0.47, alpha: 1)
        ]

        for index in 0..<8 {
            let x = shelf.minX + 10 + CGFloat(index) * 13
            let height = CGFloat(24 + (index % 3) * 8)
            rounded(CGRect(x: x, y: shelf.minY - height, width: 9, height: height), radius: 2, fill: bookColors[index % bookColors.count])
        }
    }

    private func drawFloor(in rect: CGRect, context: CGContext) {
        let floorY = rect.height * 0.75
        UIColor(red: 0.86, green: 0.78, blue: 0.66, alpha: 1).setFill()
        UIRectFill(CGRect(x: 0, y: floorY, width: rect.width, height: rect.height - floorY))

        UIColor(red: 0.63, green: 0.50, blue: 0.40, alpha: 0.24).setStroke()
        for index in 0..<8 {
            let x = CGFloat(index) * rect.width / 7
            context.move(to: CGPoint(x: x, y: floorY))
            context.addLine(to: CGPoint(x: x - 48, y: rect.maxY))
        }
        context.setLineWidth(2)
        context.strokePath()
    }

    private func drawPlants(in rect: CGRect) {
        let pot = CGRect(x: rect.width * 0.05, y: rect.height * 0.80, width: 66, height: 70)
        rounded(pot, radius: 12, fill: UIColor(red: 0.16, green: 0.32, blue: 0.29, alpha: 1))

        let leafColors = [
            UIColor(red: 0.22, green: 0.52, blue: 0.44, alpha: 0.95),
            UIColor(red: 0.95, green: 0.74, blue: 0.44, alpha: 0.86),
            UIColor(red: 0.12, green: 0.36, blue: 0.31, alpha: 0.94)
        ]

        for index in 0..<5 {
            let leaf = UIBezierPath(ovalIn: CGRect(x: pot.midX - 58 + CGFloat(index) * 22, y: pot.minY - 52 + CGFloat(index % 2) * 12, width: 58, height: 88))
            leaf.apply(CGAffineTransform(rotationAngle: CGFloat(index - 2) * 0.34))
            leafColors[index % leafColors.count].setFill()
            leaf.fill()
        }
    }

    private func drawStringLights(in rect: CGRect) {
        UIColor(red: 0.50, green: 0.34, blue: 0.25, alpha: 0.52).setStroke()
        let cord = UIBezierPath()
        cord.move(to: CGPoint(x: 0, y: rect.height * 0.08))
        cord.addCurve(
            to: CGPoint(x: rect.width, y: rect.height * 0.08),
            controlPoint1: CGPoint(x: rect.width * 0.30, y: rect.height * 0.14),
            controlPoint2: CGPoint(x: rect.width * 0.70, y: rect.height * 0.02)
        )
        cord.lineWidth = 1.5
        cord.stroke()

        for index in 0..<9 {
            let x = CGFloat(index) * rect.width / 8
            let y = rect.height * 0.08 + sin(CGFloat(index) * 0.8) * 18
            rounded(CGRect(x: x - 4, y: y - 4, width: 8, height: 8), radius: 4, fill: UIColor(red: 1.0, green: 0.77, blue: 0.45, alpha: 0.9))
        }
    }

    private func rounded(_ rect: CGRect, radius: CGFloat, fill color: UIColor) {
        color.setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: radius).fill()
    }
}
