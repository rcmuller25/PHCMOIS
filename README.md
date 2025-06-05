# PHC Management and Operations Information System (PHCMOIS)

A modern, cross-platform mobile application built with React Native and Expo for managing healthcare operations in Primary Health Centers (PHCs). This application streamlines patient management, appointment scheduling, and healthcare provider workflows.

## 🚀 Features

- **User Authentication** - Secure login and session management
- **Patient Management** - Comprehensive patient records and history
- **Appointment Scheduling** - Intuitive calendar and scheduling system
- **Profile Management** - User profiles with role-based access control
- **Offline Support** - Work seamlessly with or without internet connection
- **Secure Data Storage** - Encrypted storage for sensitive information
- **Cross-Platform** - Works on both iOS and Android devices

## 📱 Screenshots

*Screenshots will be added soon*

## 🛠️ Tech Stack

- **Frontend**: React Native with TypeScript
- **Navigation**: Expo Router
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Form Validation**: Zod
- **Local Storage**: AsyncStorage
- **Maps & Location**: Expo Location
- **Notifications**: Expo Notifications
- **Authentication**: Secure token-based authentication

## 📋 Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (for running on emulators)
- Physical device with Expo Go app (for development)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/phcmois.git
   cd PHCMOIS
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on your device**
   - Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android)
   - Or press 'i' for iOS simulator or 'a' for Android emulator

## 🔧 Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the environment variables in `.env` with your configuration.

## 🧪 Testing

Run the test suite:
```bash
npm test
# or
yarn test
```

## 🏗️ Building for Production

### Android
```bash
expo prebuild
cd android
./gradlew assembleRelease
```

### iOS
```bash
expo prebuild
cd ios
pod install
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release -sdk iphoneos
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, please open an issue in the GitHub repository.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of notable changes.

---

Built with ❤️ for better healthcare management
