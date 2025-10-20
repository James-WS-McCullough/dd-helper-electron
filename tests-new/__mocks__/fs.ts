export const promises = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  access: jest.fn()
}

export default {
  promises
}
