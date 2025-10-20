# D&D Helper - Test Suite Documentation

## Overview

This comprehensive test suite provides thorough coverage of the D&D Helper Electron application. The tests are organized into three main categories: **Unit Tests**, **Integration Tests**, and **End-to-End Tests**.

## Test Framework & Tools

### Selected Testing Stack

- **Jest** (v30.2.0): Primary testing framework
  - Chosen for its excellent support for JavaScript testing
  - Built-in mocking capabilities
  - Good integration with Electron applications
  - Fast test execution with parallel running

- **Spectron** (v19.0.0): Electron-specific testing utilities
  - Provides tools for testing Electron applications
  - Allows testing of main and renderer processes

- **Custom Mocks**: Comprehensive mock factories
  - Electron API mocks (app, BrowserWindow, ipcMain, dialog)
  - File system mocks (fs.promises)
  - Data factories for test data generation

### Why This Stack?

1. **Jest**: Industry-standard, excellent documentation, great developer experience
2. **Spectron**: Purpose-built for Electron, handles process communication
3. **Custom Mocks**: Full control over testing environment, no external dependencies required

## Test Structure

```
tests/
├── setup.js                          # Global test setup and configuration
├── unit/                             # Unit tests (isolated component testing)
│   ├── main.test.js                 # Main process unit tests
│   └── preload.test.js              # Preload script unit tests
├── integration/                      # Integration tests (component interaction)
│   ├── ipc-communication.test.js    # IPC handler integration tests
│   └── renderer-processes.test.js   # Renderer process integration tests
├── e2e/                             # End-to-end tests (complete workflows)
│   └── complete-workflows.test.js   # Full user workflow tests
└── utils/                           # Test utilities and helpers
    ├── mockFactories.js             # Mock data factories
    └── electronMocks.js             # Electron API mocks
```

## Test Coverage

### Unit Tests

#### Main Process (`tests/unit/main.test.js`)
- **Application Initialization**
  - Loading cached directory on startup
  - Creating main window when app is ready
  - Opening DevTools in development mode
  - Handling missing cached directory gracefully

- **IPC Handlers - Directory Management**
  - Selecting directories
  - Caching selected directories
  - Retrieving cached directories
  - Handling canceled selections

- **IPC Handlers - Directory Scanning**
  - Scanning directories and categorizing media files
  - Identifying portrait images
  - Identifying background images
  - Identifying audio files with correct subtypes
  - Handling scanning errors
  - Hiding files starting with underscore

- **IPC Handlers - Window Management**
  - Opening display window
  - Focusing existing display window
  - Loading dashboard in main window

- **IPC Handlers - Display State Management**
  - Displaying portrait media
  - Preventing duplicate portraits
  - Replacing backgrounds
  - Adding multiple background sounds
  - Clearing specific elements
  - Clearing all elements
  - Getting current display state

- **IPC Handlers - Party Data**
  - Saving party data to file
  - Loading party data from file
  - Handling non-existent files

- **IPC Handlers - Encounter Data**
  - Saving encounter data
  - Loading encounter data
  - Getting list of encounter files
  - Selecting encounter files

- **IPC Handlers - Battlemap Data**
  - Saving battlemap data
  - Loading battlemap data
  - Using default filename when none provided
  - Trying legacy filename when loading
  - Getting list of battlemap files
  - Displaying battlemap on display window
  - Hiding battlemap from display window

- **IPC Handlers - Initiative Tracking**
  - Saving initiative data
  - Loading initiative data
  - Handling missing initiative data

- **Application Lifecycle**
  - Quitting app when windows closed (non-macOS)
  - Not quitting on macOS
  - Creating window on activate

**Total: 50+ test cases**

#### Preload Script (`tests/unit/preload.test.js`)
- **Context Bridge Setup**
  - Exposing electronAPI to main world
  - Exposing all required API methods

- **Directory Management API**
  - selectDirectory invocation
  - getCachedDirectory invocation
  - scanDirectory invocation

- **Window Management API**
  - openDisplayWindow invocation
  - loadDashboard invocation

- **Display Media API**
  - displayMedia parameter passing
  - clearDisplayElement invocation
  - getDisplayState retrieval

- **Party Data API**
  - savePartyData invocation
  - loadPartyData invocation

- **Encounter Data API**
  - saveEncounterData invocation
  - loadEncounterData invocation
  - selectEncounterFile invocation
  - getEncounterFiles invocation

- **Initiative Tracking API**
  - saveInitiativeData invocation
  - loadInitiativeData invocation

- **Battlemap API**
  - saveBattlemapData invocation
  - loadBattlemapData invocation
  - getBattlemapFiles invocation
  - displayBattlemap invocation
  - hideBattlemap invocation

- **Event Listeners API**
  - onUpdateDisplay registration
  - onDisplayStateUpdated registration
  - onDisplayBattlemap registration
  - onHideBattlemap registration
  - removeDisplayListeners cleanup

- **API Security**
  - Not exposing raw ipcRenderer
  - Only exposing whitelisted methods
  - All methods are functions

**Total: 30+ test cases**

### Integration Tests

#### IPC Communication (`tests/integration/ipc-communication.test.js`)
- **Full Directory Selection and Scanning Workflow**
  - Select, cache, and scan directory workflow
  - Retrieve cached directory on subsequent launches

- **Display Window Lifecycle and Media Display**
  - Open display window and send media updates
  - Update main window when display state changes
  - Handle clearing display elements correctly

- **Party and Encounter Data Flow**
  - Create, save, and load party data
  - Create, save, and load encounter data
  - List and select encounter files

- **Battlemap Integration Flow**
  - Create, save, load, and display battlemap
  - List battlemap files in directory

- **Initiative Tracking Integration**
  - Save and load initiative data

- **Error Handling and Edge Cases**
  - Handle file system errors gracefully
  - Handle missing files when loading data
  - Handle invalid JSON when loading data
  - Handle display window being destroyed
  - Handle empty directory scans
  - Handle nested directory scanning

- **Cross-Window Communication**
  - Sync display state across windows
  - Maintain display state when main window navigates

**Total: 25+ test cases**

#### Renderer Processes (`tests/integration/renderer-processes.test.js`)
- **Starting Screen**
  - Load cached directory on startup
  - Enable start button when directory selected
  - Open display window and load dashboard
  - Handle canceled directory selection

- **Display Window**
  - Update portraits layer
  - Update background layer with image
  - Update background layer with video
  - Handle event video display
  - Hide/show placeholder based on content
  - Scale portraits based on count

- **Dashboard Media Controls**
  - Display media item when clicked
  - Clear display elements
  - Clear specific portrait by path
  - Clear all display content
  - Get current display state

- **Battlemap Display**
  - Calculate grid cell size correctly
  - Apply zoom to battlemap display
  - Hide battlemap and restore content

- **Error Handling**
  - Handle directory selection errors
  - Handle media display errors
  - Handle data saving errors

**Total: 20+ test cases**

### End-to-End Tests

#### Complete Workflows (`tests/e2e/complete-workflows.test.js`)
- **First Time Campaign Setup**
  - Complete full first-time setup workflow
  - Select directory, scan files, create windows
  - Create and save party data

- **Running a Combat Encounter**
  - Complete full combat encounter workflow
  - Create encounter, setup battlemap
  - Manage initiative, display tokens
  - End combat and clean up

- **Narrative Scene with Media**
  - Complete narrative scene workflow
  - Set background, add portraits
  - Play ambient music and event videos
  - Clear scene after event

- **Session Persistence and Recovery**
  - Save complete session state
  - Restart application
  - Restore all saved data (party, initiative, battlemap)

- **Multi-File Management**
  - Manage multiple encounters
  - Manage multiple battlemaps
  - List and organize campaign files

- **Error Recovery**
  - Handle disk full errors
  - Handle corrupted files
  - Handle missing files
  - Handle permission errors

**Total: 15+ test cases**

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests by Category
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Verbose Output
```bash
npm run test:verbose
```

### Debug Tests
```bash
npm run test:debug
```

## Test Configuration

The Jest configuration is defined in `jest.config.js`:

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  collectCoverageFrom: ['src/**/*.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000
}
```

## Mock Factories

### Available Mock Factories (`tests/utils/mockFactories.js`)

- `createMockBrowserWindow()` - Mock Electron BrowserWindow
- `createMockIpcEvent()` - Mock IPC event object
- `createMockFileEntry()` - Mock file system entry
- `createMockMediaItem()` - Mock media item
- `createMockDirectoryStructure()` - Mock directory tree
- `createMockDisplayState()` - Mock display state
- `createMockPartyMember()` - Mock party member
- `createMockEnemy()` - Mock enemy
- `createMockEncounter()` - Mock encounter data
- `createMockBattlemapToken()` - Mock battlemap token
- `createMockBattlemapData()` - Mock battlemap data
- `createMockFsPromises()` - Mock fs.promises module
- `createMockDialogResult()` - Mock dialog result

### Electron Mocks (`tests/utils/electronMocks.js`)

The `createElectronMock()` function provides comprehensive mocks for:
- `app` - Application lifecycle
- `BrowserWindow` - Window management
- `dialog` - File dialogs
- `ipcMain` - Main process IPC
- `ipcRenderer` - Renderer process IPC
- `contextBridge` - Context isolation bridge

## Writing New Tests

### Test Structure (Arrange-Act-Assert Pattern)

```javascript
test('should do something when condition occurs', async () => {
  // ARRANGE: Set up test data and mocks
  const testData = createMockData();
  mockFunction.mockResolvedValueOnce(expectedResult);

  // ACT: Execute the code under test
  const result = await functionUnderTest(testData);

  // ASSERT: Verify the expected outcomes
  expect(result).toBe(expectedResult);
  expect(mockFunction).toHaveBeenCalledWith(testData);
});
```

### Best Practices

1. **Clear Test Names**: Use descriptive names that explain what is being tested
2. **One Thing Per Test**: Each test should verify one specific behavior
3. **Use Mock Factories**: Leverage existing factories for consistent test data
4. **Clean Up**: Tests should be independent and not affect each other
5. **Async/Await**: Use async/await for asynchronous operations
6. **Mock External Dependencies**: Mock file system, IPC, and external APIs
7. **Test Edge Cases**: Include tests for error conditions and boundary cases

## Test Coverage Goals

- **Main Process**: >90% coverage
- **Preload Script**: >95% coverage
- **Critical Paths**: 100% coverage
- **Overall**: >85% coverage

## Areas Requiring Special Attention

### High Priority Testing Areas

1. **IPC Communication**: All IPC handlers must be thoroughly tested
2. **Display State Management**: Critical for application functionality
3. **File Persistence**: Data integrity is crucial
4. **Window Lifecycle**: Proper window management prevents memory leaks
5. **Error Handling**: All error paths should be tested

### Known Limitations

1. **Renderer DOM Manipulation**: Limited testing of actual DOM updates (mocked)
2. **Electron Native APIs**: Some native functionality is mocked
3. **Visual Regression**: No automated visual testing
4. **Performance Testing**: No performance benchmarks included

### Future Enhancements

- Add visual regression testing for UI components
- Add performance benchmarks for large directory scans
- Add accessibility testing
- Add security testing for IPC handlers
- Consider adding Playwright for true E2E testing

## Troubleshooting

### Common Issues

**Tests timeout**
- Increase timeout in jest.config.js or individual tests
- Check for unresolved promises

**Mocks not working**
- Ensure jest.resetModules() is called in beforeEach
- Check mock implementation order

**File not found errors**
- Verify file paths are absolute
- Check that mocks are properly set up

**Tests fail randomly**
- Tests may not be independent
- Add proper cleanup in afterEach

## Contributing to Tests

When adding new features to the application:

1. Write unit tests for new functions/methods
2. Write integration tests for new IPC handlers
3. Update E2E tests if new workflows are added
4. Update mock factories if new data structures are introduced
5. Maintain test coverage above 85%

## Support

For questions about the test suite:
- Review this documentation
- Check test examples in existing test files
- Refer to Jest documentation: https://jestjs.io/
- Refer to Electron testing guides: https://www.electronjs.org/docs/latest/tutorial/automated-testing

---

**Total Test Coverage**: 140+ test cases across unit, integration, and E2E tests
