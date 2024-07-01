import {defineRosepack} from "rosepack";

export default defineRosepack((config) => ({
  clean: config.mode === "production",
  format: [
    "dts",
    "esm",
  ],
  input: {
    bin: {
      input: "source/bin/index.ts",
      format: "esm",
    },
    main: "source/main/index.ts",
  },
}));
