export default {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "js"],
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transformIgnorePatterns: ["/node_modules/"],
};
