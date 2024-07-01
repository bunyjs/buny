import container, {Constructor, createMetadata, Metadata, TokenValue, createDecorator, DecoratorType} from "@bunyjs/ioc";

interface EventOptions {
  before?: TokenValue<unknown> | TokenValue<unknown>[];
  after?: TokenValue<unknown> | TokenValue<unknown>[];
}

interface EventMetadata extends EventOptions {
  method: string | symbol;
  static: boolean;
}

class EventContext<Type = unknown> {
  name: string;
  metadata: Metadata<EventMetadata[]>;
  registry = new Set<Constructor<Type>>();
  container = container;

  constructor(name: string) {
    this.name = `event:${name}`;
    this.metadata = createMetadata<EventMetadata[]>(this.name);
  }

  createDecorator() {
    return createDecorator(this.name, (options?: EventOptions) => ({
      for: [
        DecoratorType.Method,
        DecoratorType.StaticMethod,
      ],
      onInit: (context) => {
        const metadata = this.metadata.from(context.class);

        const data = metadata.get([]);

        data.push({
          method: context.propertyKey,
          static: context.isStatic,
          ...options,
        });

        metadata.set(data);

        if (this.registry.has(context.class)) {
          return;
        }

        this.registry.add(context.class);
      },
    }));
  }
}

export type {
  EventMetadata,
  EventOptions,
};

export default EventContext;
