import Emittery from "emittery";

import Container from "./container";
import Provider from "./provider";
import Token, {TokenValue} from "./token";

interface ObserverEvent {
  container: Container;
  unsubscribe: () => void;
}

interface RegisterObserver<Value> extends ObserverEvent {
  token: Token<Value>;
}

interface RegisteredObserver<Value> extends RegisterObserver<Value> {
  provider: Provider<Value>;
}

//

interface ResolveObserver<Value> extends ObserverEvent {
  token: Token<Value>;
}

interface ResolvedObserver<Value> extends ResolveObserver<Value> {
  provider: Provider<Value>;
  value: Value;
}

//

interface DisposeObserver<Value> extends ObserverEvent {
  token: Token<Value>;
}

interface DisposedObserver<Value> extends DisposeObserver<Value> {
  provider: Provider<Value>;
}

//

interface DestroyObserver<Value> extends ObserverEvent {
  token: Token<Value>;
}

interface DestroyedObserver<Value> extends DestroyObserver<Value> {
  provider: Provider<Value>;
}

interface ObserverContext<Value> {
  register?: (event: RegisterObserver<Value>) => void;
  registered?: (event: RegisteredObserver<Value>) => void;
  //
  resolve?: (event: ResolveObserver<Value>) => void;
  resolved?: (event: ResolvedObserver<Value>) => void;
  //
  dispose?: (event: DisposeObserver<Value>) => void;
  disposed?: (event: DisposedObserver<Value>) => void;
  //
  destroy?: (event: DestroyObserver<Value>) => void;
  destroyed?: (event: DestroyedObserver<Value>) => void;
}

//

interface BoostrapEvent {
  container: Container;
}

//

interface RegisterEvent<Value> extends BoostrapEvent {
  token: Token<Value>;
}

interface RegisteredEvent<Value> extends RegisterEvent<Value> {
  provider: Provider<Value>;
}

//

interface ResolveEvent<Value> extends BoostrapEvent {
  token: Token<Value>;
}

interface ResolvedEvent<Value> extends ResolveEvent<Value> {
  provider: Provider<Value>;
  value: Value;
}

//

interface DisposeEvent<Value> extends BoostrapEvent {
  token: Token<Value>;
}

interface DisposedEvent<Value> extends DisposeEvent<Value> {
  provider: Provider<Value>;
}

//

interface DestroyEvent<Value> extends BoostrapEvent {
  token: Token<Value>;
}

interface DestroyedEvent<Value> extends DestroyEvent<Value> {
  provider: Provider<Value>;
}

interface ContainerEvents {
  boostrap: BoostrapEvent;
  //
  register: RegisterEvent<unknown>;
  registered: RegisteredEvent<unknown>;
  //
  resolve: ResolveEvent<unknown>;
  resolved: ResolvedEvent<unknown>;
  //
  dispose: DisposeEvent<unknown>;
  disposed: DisposedEvent<unknown>;
  //
  destroy: DestroyEvent<unknown>;
  destroyed: DestroyedEvent<unknown>;
}

class Emitter extends Emittery<ContainerEvents> {
  observe<Value>(value: TokenValue<Value>, context: ObserverContext<Value>) {
    const token = Token.from(value);

    const unsubscribes = [];

    if (context.register) {
      const unsubscribe = this.on("register", (event) => {
        if (token.match(event.token)) {
          return context.register({
            container: event.container,
            token: event.token as Token<Value>,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    if (context.registered) {
      const unsubscribe = this.on("registered", (event) => {
        if (token.match(event.token)) {
          return context.registered({
            container: event.container,
            provider: event.provider as Provider<Value>,
            token: event.token as Token<Value>,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    //

    if (context.resolve) {
      const unsubscribe = this.on("resolve", (event) => {
        if (token.match(event.token)) {
          return context.resolve({
            container: event.container,
            token: event.token as Token<Value>,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    if (context.resolved) {
      const unsubscribe = this.on("resolved", (event) => {
        if (token.match(event.token)) {
          return context.resolved({
            container: event.container,
            provider: event.provider as Provider<Value>,
            token: event.token as Token<Value>,
            value: event.value as Value,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    //

    if (context.dispose) {
      const unsubscribe = this.on("dispose", (event) => {
        if (token.match(event.token)) {
          return context.dispose({
            container: event.container,
            token: event.token as Token<Value>,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    if (context.disposed) {
      const unsubscribe = this.on("disposed", (event) => {
        if (token.match(event.token)) {
          return context.disposed({
            container: event.container,
            provider: event.provider as Provider<Value>,
            token: event.token as Token<Value>,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    //

    if (context.destroy) {
      const unsubscribe = this.on("destroy", (event) => {
        if (token.match(event.token)) {
          return context.destroy({
            container: event.container,
            token: event.token as Token<Value>,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    if (context.destroyed) {
      const unsubscribe = this.on("destroyed", (event) => {
        if (token.match(event.token)) {
          return context.destroyed({
            container: event.container,
            provider: event.provider as Provider<Value>,
            token: event.token as Token<Value>,
            unsubscribe,
          });
        }
      });

      unsubscribes.push(unsubscribe);
    }

    //

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }
}

export default Emitter;
