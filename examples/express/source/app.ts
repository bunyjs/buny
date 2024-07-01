import http from "http";

import type {Request, Response, Application} from "express";
import express from "express";

import container, {Token, createDecorator, DecoratorType, useValue, invoke} from "@bunyjs/ioc";

import App, {init, shutdown, start} from "@bunyjs/core";
import Logger from "@bunyjs/logger";

import {usable, use} from "@bunyjs/di";

const reqToken = Token.create<Request>("req");
const resToken = Token.create<Response>("res");

const Req = createDecorator("req", () => ({
  apply: [
    DecoratorType.Parameter,
  ],
  onInit: (context) => {
    context.defineParameter((context) => {
      return context.container.resolve(reqToken);
    });
  },
}));
const Res = createDecorator("res", () => ({
  apply: [
    DecoratorType.Parameter,
  ],
  onInit: (context) => {
    context.defineParameter((context) => {
      return context.container.resolve(resToken);
    });
  },
}));

@usable()
class UserService {
  private users = [
    {
      id: 1,
      name: "John Doe",
    },
  ];

  getUsers() {
    return this.users;
  }
}

@usable()
class UserController {
  @use()
    userService: UserService;

  getUsers(@Req() req: Request, @Res() res: Response) {
    console.log(req.hostname);

    const users = this.userService.getUsers();

    res.json(users);
  }
}

@usable()
class Api extends App {
  app: Application;
  server: http.Server;

  @use()
    logger: Logger;

  @init()
  init() {
    this.app = express();

    this.app.get("/users", async (req, res) => {
      const scope = container.createScope();

      await scope.register(reqToken, useValue({
        value: req,
      }));

      await scope.register(resToken, useValue({
        value: res,
      }));

      await invoke({
        token: UserController,
        method: "getUsers",
        container: scope,
      });

      await scope.destroyAll();
    });
  }

  @start()
  start() {
    this.server = this.app.listen(8000, () => {
      this.logger.info("Server is running on port 8000");
    });
  }

  @shutdown()
  shutdown() {
    this.server.close();
  }
}

await Api.bootstrap();
