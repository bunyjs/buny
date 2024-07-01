import chalk from "chalk";

import Config from "@bunyjs/config";

import {usable, use} from "@bunyjs/di";

type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const colors = {
  info: (...messages: any[]) => {
    return chalk.hex("#00ff32")(messages.map((value) => String(value)).join(" "));
  },
  warn: (...messages: any[]) => {
    return chalk.hex("#fcff32")(messages.map((value) => String(value)).join(" "));
  },
  debug: (...messages: any[]) => {
    return chalk.hex("#3232ff")(messages.map((value) => String(value)).join(" "));
  },
  error: (...messages: any[]) => {
    return chalk.hex("#ff3200")(messages.map((value) => String(value)).join(" "));
  },
  mark: (...messages: any[]) => {
    return chalk.bold.hex("#fcd910")(messages.map((value) => String(value)).join(" "));
  },
};

interface LoggerConfig {
  level?: LogLevel;
}

declare module "@bunyjs/config" {
  interface ExtendableConfig {
    logger?: LoggerConfig;
  }
}

@usable()
class Logger {
  @use()
    config: Config;

  private canLog = (level: LogLevel) => {
    const levels = ["debug", "info", "warn", "error", "silent"];
    const configuredLevel = this.config.logger?.level ?? "info";
    return levels.indexOf(configuredLevel) <= levels.indexOf(level);
  };

  debug = (...messages: any[]) => {
    if (!this.canLog("debug")) {
      return this;
    }

    console.debug(`[${colors.debug("debug")}] :`, colors.debug(...messages));

    return this;
  };

  info = (...messages: any[]) => {
    if (!this.canLog("info")) {
      return this;
    }

    console.info(`[${colors.info("info")}] :`, ...messages);

    return this;
  };

  warn = (...messages: any[]) => {
    if (!this.canLog("warn")) {
      return this;
    }

    console.warn(`[${colors.warn("warn")}] :`, colors.warn(messages));

    return this;
  };

  error = (error: unknown) => {
    if (!this.canLog("error")) {
      return this;
    }

    let message = error;

    if (error instanceof Error) {
      if (error.stack) {
        message = error.stack;
      } else if (error.message) {
        message = error.message;
      }
    }

    console.error(`[${colors.error("error")}] :`, colors.error(message));

    return this;
  };

  mark(...messages: any) {
    return colors.mark(...messages);
  }
}

export default Logger;
