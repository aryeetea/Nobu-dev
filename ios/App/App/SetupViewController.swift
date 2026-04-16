import UIKit

struct NobuSetupProfile {
    let name: String
    let username: String
    let password: String
    let birthday: String
}

final class SetupViewController: UIViewController {
    var onSubmit: ((NobuSetupProfile, SetupViewController) -> Void)?

    private let cardView = UIView()
    private let stackView = UIStackView()
    private let nameField = UITextField()
    private let usernameField = UITextField()
    private let passwordField = UITextField()
    private let birthdayField = UITextField()
    private let birthdayPicker = UIDatePicker()
    private let errorLabel = UILabel()
    private let submitButton = UIButton(type: .system)
    private let activityIndicator = UIActivityIndicatorView(style: .medium)

    override func viewDidLoad() {
        super.viewDidLoad()
        configureView()
        configureFields()
        configureLayout()
    }

    func showError(_ message: String) {
        isSubmitting(false)
        errorLabel.text = message
        errorLabel.isHidden = false
    }

    func isSubmitting(_ submitting: Bool) {
        submitButton.isEnabled = !submitting
        birthdayPicker.isEnabled = !submitting
        [nameField, usernameField, passwordField, birthdayField].forEach { $0.isEnabled = !submitting }

        if submitting {
            activityIndicator.startAnimating()
            submitButton.configuration?.title = "Creating..."
        } else {
            activityIndicator.stopAnimating()
            submitButton.configuration?.title = "Create profile"
        }
    }

    private func configureView() {
        modalPresentationStyle = .fullScreen
        isModalInPresentation = true
        view.backgroundColor = UIColor(red: 0.98, green: 0.93, blue: 0.90, alpha: 1)

        let gradientView = NobuSetupGradientView()
        gradientView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(gradientView)

        cardView.translatesAutoresizingMaskIntoConstraints = false
        cardView.backgroundColor = UIColor.white.withAlphaComponent(0.92)
        cardView.layer.cornerRadius = 8
        cardView.layer.shadowColor = UIColor.black.cgColor
        cardView.layer.shadowOpacity = 0.14
        cardView.layer.shadowRadius = 24
        cardView.layer.shadowOffset = CGSize(width: 0, height: 12)
        view.addSubview(cardView)

        NSLayoutConstraint.activate([
            gradientView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            gradientView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            gradientView.topAnchor.constraint(equalTo: view.topAnchor),
            gradientView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            cardView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 22),
            cardView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -22),
            cardView.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            cardView.heightAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.heightAnchor, multiplier: 0.84)
        ])
    }

    private func configureFields() {
        nameField.placeholder = "Name"
        nameField.textContentType = .name
        nameField.autocapitalizationType = .words
        nameField.returnKeyType = .next

        usernameField.placeholder = "Username"
        usernameField.textContentType = .username
        usernameField.autocapitalizationType = .none
        usernameField.autocorrectionType = .no
        usernameField.returnKeyType = .next

        passwordField.placeholder = "Password"
        passwordField.textContentType = .newPassword
        passwordField.isSecureTextEntry = true
        passwordField.returnKeyType = .done

        birthdayField.placeholder = "Birthday"
        birthdayField.inputView = birthdayPicker
        birthdayField.textContentType = .none
        birthdayField.tintColor = .clear

        birthdayPicker.datePickerMode = .date
        birthdayPicker.maximumDate = Date()
        birthdayPicker.preferredDatePickerStyle = .wheels
        birthdayPicker.addTarget(self, action: #selector(birthdayChanged), for: .valueChanged)
        birthdayChanged()

        [nameField, usernameField, passwordField, birthdayField].forEach(configureTextField)
    }

    private func configureLayout() {
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.alignment = .fill
        stackView.spacing = 12
        cardView.addSubview(stackView)

        let eyebrowLabel = UILabel()
        eyebrowLabel.text = "NOBU"
        eyebrowLabel.font = UIFont.systemFont(ofSize: 13, weight: .heavy)
        eyebrowLabel.textColor = UIColor(red: 0.78, green: 0.38, blue: 0.50, alpha: 1)
        eyebrowLabel.textAlignment = .center

        let titleLabel = UILabel()
        titleLabel.text = "Create your profile"
        titleLabel.font = UIFont.systemFont(ofSize: 28, weight: .bold)
        titleLabel.textColor = UIColor(red: 0.14, green: 0.16, blue: 0.18, alpha: 1)
        titleLabel.textAlignment = .center
        titleLabel.numberOfLines = 0

        let detailLabel = UILabel()
        detailLabel.text = "Nobu uses your name for natural greetings and your birthday for small personal moments."
        detailLabel.font = UIFont.systemFont(ofSize: 15, weight: .medium)
        detailLabel.textColor = UIColor(red: 0.42, green: 0.44, blue: 0.47, alpha: 1)
        detailLabel.textAlignment = .center
        detailLabel.numberOfLines = 0

        errorLabel.font = UIFont.systemFont(ofSize: 13, weight: .semibold)
        errorLabel.textColor = UIColor(red: 0.72, green: 0.18, blue: 0.22, alpha: 1)
        errorLabel.numberOfLines = 0
        errorLabel.textAlignment = .center
        errorLabel.isHidden = true

        var submitConfiguration = UIButton.Configuration.filled()
        submitConfiguration.title = "Create profile"
        submitConfiguration.baseForegroundColor = .white
        submitConfiguration.baseBackgroundColor = UIColor(red: 0.17, green: 0.20, blue: 0.22, alpha: 1)
        submitConfiguration.cornerStyle = .fixed
        submitConfiguration.contentInsets = NSDirectionalEdgeInsets(top: 14, leading: 16, bottom: 14, trailing: 16)
        submitButton.configuration = submitConfiguration
        submitButton.layer.cornerRadius = 8
        submitButton.clipsToBounds = true
        submitButton.addTarget(self, action: #selector(submitPressed), for: .touchUpInside)

        activityIndicator.hidesWhenStopped = true

        stackView.addArrangedSubview(eyebrowLabel)
        stackView.addArrangedSubview(titleLabel)
        stackView.addArrangedSubview(detailLabel)
        stackView.setCustomSpacing(20, after: detailLabel)
        stackView.addArrangedSubview(nameField)
        stackView.addArrangedSubview(usernameField)
        stackView.addArrangedSubview(passwordField)
        stackView.addArrangedSubview(birthdayField)
        stackView.addArrangedSubview(errorLabel)
        stackView.addArrangedSubview(submitButton)
        stackView.addArrangedSubview(activityIndicator)

        NSLayoutConstraint.activate([
            stackView.leadingAnchor.constraint(equalTo: cardView.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: cardView.trailingAnchor, constant: -20),
            stackView.topAnchor.constraint(equalTo: cardView.topAnchor, constant: 24),
            stackView.bottomAnchor.constraint(equalTo: cardView.bottomAnchor, constant: -24)
        ])
    }

    private func configureTextField(_ textField: UITextField) {
        textField.backgroundColor = UIColor(red: 0.97, green: 0.94, blue: 0.92, alpha: 1)
        textField.textColor = UIColor(red: 0.15, green: 0.16, blue: 0.17, alpha: 1)
        textField.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        textField.layer.cornerRadius = 8
        textField.layer.borderColor = UIColor(red: 0.84, green: 0.76, blue: 0.72, alpha: 1).cgColor
        textField.layer.borderWidth = 1
        textField.heightAnchor.constraint(equalToConstant: 50).isActive = true
        textField.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 14, height: 1))
        textField.leftViewMode = .always
        textField.rightView = UIView(frame: CGRect(x: 0, y: 0, width: 14, height: 1))
        textField.rightViewMode = .always
    }

    @objc private func birthdayChanged() {
        birthdayField.text = Self.birthdayFormatter.string(from: birthdayPicker.date)
    }

    @objc private func submitPressed() {
        errorLabel.isHidden = true
        view.endEditing(true)

        let profile = NobuSetupProfile(
            name: nameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "",
            username: usernameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "",
            password: passwordField.text ?? "",
            birthday: birthdayField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        )

        guard !profile.name.isEmpty else {
            showError("Add your name so Nobu knows what to call you.")
            return
        }

        guard profile.username.count >= 3 else {
            showError("Choose a username with at least 3 characters.")
            return
        }

        guard profile.password.count >= 8 else {
            showError("Use a password with at least 8 characters.")
            return
        }

        guard !profile.birthday.isEmpty else {
            showError("Choose your birthday.")
            return
        }

        isSubmitting(true)
        onSubmit?(profile, self)
    }

    private static let birthdayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}

private final class NobuSetupGradientView: UIView {
    override class var layerClass: AnyClass {
        CAGradientLayer.self
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard let gradientLayer = layer as? CAGradientLayer else {
            return
        }

        gradientLayer.colors = [
            UIColor(red: 0.99, green: 0.91, blue: 0.89, alpha: 1).cgColor,
            UIColor(red: 0.90, green: 0.96, blue: 0.95, alpha: 1).cgColor,
            UIColor(red: 0.98, green: 0.92, blue: 0.84, alpha: 1).cgColor
        ]
        gradientLayer.locations = [0, 0.55, 1]
        gradientLayer.startPoint = CGPoint(x: 0.2, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
    }
}
