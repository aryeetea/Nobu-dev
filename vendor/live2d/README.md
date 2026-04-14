# Live2D SDK Vendor Area

Place official Live2D Cubism SDK files here only after downloading them from Live2D and confirming the license allows the files to be included in this app repository.

Expected downloads:

- Cubism SDK for Native, iOS
- Cubism SDK for Native, Android

Suggested local layout after the SDKs are downloaded and license-checked:

- `vendor/live2d/ios`
- `vendor/live2d/android`
- `vendor/live2d/sdk-source`

Do not commit the full SDK blindly. First confirm which framework, library, header, resource, and license files are redistributable.

These SDK folders are intentionally ignored by git. They can exist on your machine for Xcode and Android Studio without being pushed to GitHub.

The creator model files stay separate from the SDK:

- `public/models/Alexia`
- `public/models/ASUKA`
