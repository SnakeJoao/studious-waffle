module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": "babel-jest",
  },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
};
