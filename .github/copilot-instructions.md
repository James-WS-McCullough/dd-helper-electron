<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# DnD Helper Electron App

This is a D&D helper application built with Electron that allows users to manage and display media files (images, videos, audio) for tabletop gaming sessions.

## Project Structure

- Main process handles file system access and window management
- Renderer processes for UI (starting screen, dashboard, display window)
- Uses Electron's dialog API for directory selection
- File system scanning for media organization

## Development Guidelines

- Follow Electron security best practices
- Use contextIsolation and disable nodeIntegration
- Implement proper IPC communication between processes
- Handle media file types: images (jpg, png, gif), videos (mp4, webm), audio (mp3, wav, ogg)

## Features Implemented

- **Starting Screen**: Directory selection and session launch with caching
- **Dashboard**: File browser with expandable folder structure and live display panel
- **Display Window**: Layered media display with portraits, backgrounds, and events
- **Media Types**:
  - **Portraits** (images): Character images displayed in grid with names
  - **Backgrounds** (images/videos): Full-screen backgrounds, videos loop
  - **Events** (videos): Full-screen videos that play once and fade back
- **Live Display Management**: Real-time panel showing what's currently displayed
- **Security**: Secure IPC communication with context isolation
- **Directory Caching**: Remembers last selected directory

## Usage

1. Run `npm run dev` to start in development mode
2. App automatically loads your cached directory (if available)
3. Click "Start Session" to open dashboard and display windows
4. Browse folders in dashboard and click media files:
   - **Portrait images**: Add to character grid (files starting with \_ show as "???")
   - **Background images**: Set as full-screen background (files ending with \_location)
   - **Event videos**: Play full-screen and fade back when complete
   - **Background videos**: Set as looping background (files ending with \_location)
5. Use live display panel to see what's currently shown and clear elements
6. Keyboard controls: Escape to clear/stop, Spacebar to play/pause

## Completed Tasks

- [x] Created project structure with proper Electron setup
- [x] Implemented starting screen with directory selection
- [x] Built dashboard with recursive folder scanning
- [x] Created display window with media rendering
- [x] Added secure IPC communication
- [x] Installed dependencies and created development tasks
