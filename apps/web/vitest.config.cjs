const path = require("node:path")

module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/app/api/**/*.test.ts", "src/lib/**/*.test.ts"],
  },
}
