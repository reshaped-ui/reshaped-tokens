// https://www.figma.com/plugin-docs/manifest/
export default {
  name: "Reshaped",
  id: "1132648122057236517",
  api: "1.0.0",
  main: "./canvas.js",
  ui: "./plugin.html",
  editorType: ["figma"],
  documentAccess: "dynamic-page",
  networkAccess: {
    allowedDomains: ["none"],
  },
};
