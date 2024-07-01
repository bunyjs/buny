import {createCommand} from "commander";

import Buny from "~/main";

const start = createCommand("start");

start.description("Run in production mode");

start.action(async () => {
  const buny = new Buny({
    mode: "production",
  });

  try {
    await buny.init();
    await buny.run();
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
});

export default start;
