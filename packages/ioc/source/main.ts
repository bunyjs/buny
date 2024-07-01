import "reflect-metadata";

import Container from "~/domain/container";
import Provider from "~/domain/provider";
import Token from "~/domain/token";

const container = new Container();

export * from "~/domain/container";
export * from "~/domain/provider";
export * from "~/domain/token";

export * from "~/providers/class/decorator";
export * from "~/providers/class/metadata";
export * from "~/providers/class/provider";
export * from "~/providers/class/utility";

export * from "~/providers/factory/provider";

export * from "~/providers/value/provider";

export * from "~/types/class";

export * from "~/utility/registry";

export {
  Container,
  Provider,
  Token,
};

export default container;
