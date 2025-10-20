// Global test setup file

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock Electron app methods that are commonly used
global.mockElectronApp = {
  getPath: jest.fn((name) => {
    const paths = {
      'userData': '/tmp/test-user-data',
      'appData': '/tmp/test-app-data',
      'home': '/tmp/test-home'
    };
    return paths[name] || '/tmp/test-path';
  }),
  whenReady: jest.fn(() => Promise.resolve()),
  quit: jest.fn(),
  on: jest.fn()
};

// Increase timeout for Electron tests
jest.setTimeout(30000);

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
