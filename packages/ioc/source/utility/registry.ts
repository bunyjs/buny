import Token, {TokenValue, TokenId} from "~/domain/token";

class Registry<Value extends unknown> {
  private set = new Set<TokenId>();

  add(token: TokenValue<Value>) {
    token = Token.from(token);
    return this.set.add(token.id);
  }

  has(token: TokenValue<Value>) {
    token = Token.from(token);
    return this.set.has(token.id);
  }

  delete(token: TokenValue<Value>) {
    token = Token.from(token);
    this.set.delete(token.id);
  }

  values() {
    return Array.from(this.set.values()).map((id) => {
      return Token.create<Value>(id);
    });
  }

  clear() {
    return this.set.clear();
  }
}

export {
  Registry,
};
