const path = require("path");

const entry = process.env.ENTRY === "3d" ? "./example/app3d.ts" : "./example/app.ts";

module.exports = {
  entry: entry,
  mode: "development",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.json"),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "BdvEngine"),
  },
};
