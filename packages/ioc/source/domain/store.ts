import Provider from "./provider";
import Token, {TokenId} from "./token";

interface BasePointer {
  type: "provider" | "mapper";
}

interface ProviderPointer extends BasePointer {
  type: "provider";
  provider: Provider<unknown> | Provider<unknown>[];
}

interface MapperPointer extends BasePointer {
  type: "mapper";
  token: Token<unknown> | Token<unknown>[];
}

type Pointer = ProviderPointer | MapperPointer;

class Store extends Map<TokenId, Pointer> {
  hasToken = <Value>(token: Token<Value>) => {
    return this.has(token.id);
  };

  getToken = <Value>(token: Token<Value>) => {
    return this.get(token.id);
  };

  setToken = <Value>(token: Token<Value>, pointer: Pointer) => {
    this.set(token.id, pointer);
  };
}

export default Store;
