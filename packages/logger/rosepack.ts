import {defineRosepack} from "rosepack";

export default defineRosepack((config) => ({
  clean: config.mode === "production",
  input: {
    main: "source/main.ts",
  },
}));
