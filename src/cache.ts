export class Cache<T, U> {
  private size = 100;
  private _map = new Map<T, U>();
  private _list: T[] = [];

  constructor(size: number = 100) {
    this.size = size;
  }

  private removeKeyFromList(key: T) {
    let index = -1;
    for (let i = 0; i < this._list.length; i++) {
      if (this._list[i] === key) {
        index = i;
        break;
      }
    }
    if (index >= 0) {
      this._list.splice(index, 1);
    }
  }

  private trim() {
    while (this._list.length > this.size) {
      const key = this._list.shift();
      if (key) {
        this._map.delete(key);
      }
    }
  }

  set(key: T, value: U) {
    const exists = this._map.has(key);
    this._map.set(key, value);
    if (exists) {
      this.removeKeyFromList(key);
      this._list.push(key);
    } else {
      this._list.push(key);
      this.trim();
    }
  }

  get(key: T): U | undefined {
    return this._map.get(key);
  }

  delete(key: T): boolean {
    const ret = this._map.delete(key);
    if (ret) {
      this.removeKeyFromList(key);
    }
    return ret;
  }

  clear() {
    this._list = [];
    this._map.clear();
  }
}