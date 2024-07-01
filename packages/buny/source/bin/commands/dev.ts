import {createCommand} from "commander";

import Buny from "~/main";

const dev = createCommand("dev");

dev.description("Run in development mode");

dev.action(async () => {
  const buny = new Buny({
    mode: "development",
  });

  try {
    await buny.init();
    await buny.run();
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
});

export default dev;
