import {EventContext} from "@bunyjs/event";

const events = {
  beforeInit: new EventContext("app:before:init"),
  init: new EventContext("app:init"),
  afterInit: new EventContext("app:after:init"),
  //
  beforeStart: new EventContext("app:before:start"),
  start: new EventContext("app:start"),
  afterStart: new EventContext("app:after:start"),
  //
  beforeShutdown: new EventContext("app:before:shutdown"),
  shutdown: new EventContext("app:shutdown"),
  afterShutdown: new EventContext("app:after:shutdown"),
};

const beforeInit = events.beforeInit.createDecorator();
const init = events.init.createDecorator();
const afterInit = events.afterInit.createDecorator();

const beforeStart = events.beforeStart.createDecorator();
const start = events.start.createDecorator();
const afterStart = events.afterStart.createDecorator();

const beforeShutdown = events.beforeShutdown.createDecorator();
const shutdown = events.shutdown.createDecorator();
const afterShutdown = events.afterShutdown.createDecorator();

export {
  beforeInit,
  init,
  afterInit,
  //
  beforeStart,
  start,
  afterStart,
  //
  beforeShutdown,
  shutdown,
  afterShutdown,
};

export default events;
