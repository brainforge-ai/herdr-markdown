// Loaded with `node --import` before the tests: makes `import ... from "herdr"` resolve to the stub,
// so files that talk to the Herdr app can be loaded and driven outside it.
import { register } from "node:module";

register("./herdr-loader.js", import.meta.url);
