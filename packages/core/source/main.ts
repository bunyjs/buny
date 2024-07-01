import container, {useValue} from "@bunyjs/ioc";

import {usable, use} from "@bunyjs/di";

import Config, {ExtendableConfig} from "@bunyjs/config";
import Event from "@bunyjs/event";
import Logger from "@bunyjs/logger";

import events from "./domain/events";

@usable()
class App {
  @use()
    config: Config;

  @use()
    event: Event;

  @use()
    logger: Logger;

  constructor() {
    process.on("beforeExit", async (code) => {
      await this.event_shutdown();

      if (code !== 0) {
        process.exit(code);
      }
    });

    const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        process.emit("beforeExit", 0);
      });
    });

    process.on("uncaughtException", async (error) => {
      this.logger.error(error);
      await this.event_shutdown();
      process.exit(1);
    });

    process.on("unhandledRejection", async (error) => {
      this.logger.error(error);
      await this.event_shutdown();
      process.exit(1);
    });
  }

  private event_init = async () => {
    await this.event.invoke(events.beforeInit);
    await this.event.invoke(events.init);
    await this.event.invoke(events.afterInit);
  };

  private event_start = async () => {
    await this.event.invoke(events.beforeStart);
    await this.event.invoke(events.start);
    await this.event.invoke(events.afterStart);
  };

  private event_shutdown = async () => {
    try {
      await this.event.invoke(events.beforeShutdown);
      await this.event.invoke(events.shutdown);
      await this.event.invoke(events.afterShutdown);

      await container.destroyAll();
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  };

  bootstrap = async () => {
    await this.event_init();
    await this.event_start();
  };

  static bootstrap = async (extendableConfig?: ExtendableConfig) => {
    const config = new Config(extendableConfig);

    await container.register(Config, useValue({
      value: config,
    }));

    await container.boostrap();

    const app = await container.resolve(App);

    await app.bootstrap();

    return app;
  };

  quit = async () => {
    await this.event_shutdown();
  };

  static quit = async () => {
    const app = await container.resolve(App);

    await app.quit();

    return app;
  };
}

export * from "./domain/events";

export default App;
