import App from "@bunyjs/core";

import container, {useClass} from "@bunyjs/ioc";

class MyService {
}

container.observe(MyService, {
  register(context) {
    console.log("Registering", context.token.toString());
  },
  registered(context) {
    console.log("Registered", context.token.toString());
  },
  resolve(context) {
    console.log("Resolving", context.token.toString());
  },
  resolved(context) {
    console.log("Resolved", context.token.toString(), context.value);
  },
  dispose(context) {
    console.log("Disposing", context.token.toString());
  },
  disposed(context) {
    console.log("Disposed", context.token.toString());
  },
  destroy(context) {
    console.log("Destroying", context.token.toString());
  },
  destroyed(context) {
    console.log("Destroyed", context.token.toString());
  },
});

await App.bootstrap();

await container.register(MyService, useClass({
  constructor: MyService,
}));

await container.resolve(MyService);
