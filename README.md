# D&D Helper Electron App

A desktop application built with Electron for managing and displaying media files during D&D sessions.

## Features

- **Starting Screen**: Select your media directory and launch the session
- **Directory Caching**: Automatically remembers your last selected directory
- **Dashboard**: Browse through your media files organized in folders
- **Display Window**: Show selected media on a separate window (perfect for second monitor)
- **Media Support**: Images (jpg, png, gif), Videos (mp4, webm), Audio (mp3, wav, ogg)

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

### Building the Application

To create a distributable package:
```bash
npm run build
```

## How to Use

1. **Launch the App**: Run `npm start` or `npm run dev`
2. **Automatic Directory Loading**: If you've used the app before, your previous directory will be automatically loaded (shown with a green border)
3. **Select New Directory** (optional): Click "Select Media Directory" to choose a different folder
4. **Start Session**: Click "Start Session" to open the dashboard and display window
5. **Browse Media**: In the dashboard, click folders to expand them and see their contents
6. **Display Media**: Click on any media file to display it in the display window
7. **Keyboard Controls**: In the display window, use:
   - `Escape` to clear the display
   - `Spacebar` to play/pause videos and audio

## Project Structure

```
src/
├── main.js              # Main Electron process
├── preload.js           # Preload script for secure IPC
└── renderer/
    ├── starting-screen.html  # Initial setup screen
    ├── dashboard.html        # Media browser interface
    └── display-window.html   # Media display window
```

## Development

The app uses Electron's security best practices:
- Context isolation enabled
- Node integration disabled
- Secure IPC communication between processes

To add new features:
1. Update the main process (`main.js`) for new IPC handlers
2. Add corresponding API methods to `preload.js`
3. Implement UI changes in the appropriate HTML files

## Supported Media Formats

- **Images**: .jpg, .jpeg, .png, .gif
- **Videos**: .mp4, .webm
- **Audio**: .mp3, .wav, .ogg

## License

MIT
