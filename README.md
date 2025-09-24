# D&D Helper Electron App

A desktop application built with Electron for managing and displaying media files during D&D sessions.

## Features

- **Starting Screen**: Select your media directory and launch the session
- **Directory Caching**: Automatically remembers your last selected directory
- **Dashboard**: Browse through your media files organized in folders with three main tabs:
  - **Media Tab**: Browse images and videos for backgrounds, portraits, and events
  - **Audio Tab**: Navigate and play sound effects, background music, and ambient loops
  - **Party Tab**: Configure and manage your D&D party with character portraits and stats
- **Display Window**: Show selected media on a separate window (perfect for second monitor)
- **Media Support**: Images (jpg, png, gif), Videos (mp4, webm), Audio (mp3, wav, ogg)
- **Party Editor**: Create and manage party members with:
  - Character names
  - Portrait selection from available images
  - Armor Class (AC)
  - Passive Perception
  - Movement Speed
  - Save/Load party data as JSON file

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
5. **Browse Media**: Use the tabs in the dashboard:
   - **Media Tab**: Browse folders and click images/videos to display them
   - **Audio Tab**: Navigate folders and click audio files to play them
   - **Party Tab**: Create and manage your D&D party
6. **Party Management**:
   - Click "Add Player" to create a new party member
   - Click on the portrait circle to select a character image
   - Fill in character stats (AC, Passive Perception, Speed)
   - Use "Save Party" to save your party configuration
   - Use "Load Party" to reload saved party data
7. **Display Media**: Click on any media file to display it in the display window
8. **Keyboard Controls**: In the display window, use:
   - `Escape` to clear the display
   - `Spacebar` to play/pause videos and audio

## Party Configuration

The party editor creates a `party.json` file in your selected media directory containing:

```json
[
  {
    "name": "Character Name",
    "portrait": "/path/to/portrait/image.jpg",
    "portraitName": "Portrait Display Name",
    "ac": 15,
    "passivePerception": 12,
    "speed": 30
  }
]
```

This file is automatically saved when you click "Save Party" and loaded when you open the Party tab.

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
