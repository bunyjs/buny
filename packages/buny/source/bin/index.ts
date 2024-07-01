#!/usr/bin/env node

import {Command} from "commander";

import dev from "./commands/dev";
import start from "./commands/start";

import util from "util";

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.colors = true;

const commander = new Command();

commander.name("Buny");

commander.option("--debug", "Enable debug mode");
commander.on("option:debug", () => {
  process.env.DEBUG = "true";
});

commander.addCommand(dev);
commander.addCommand(start);

commander.parse();
