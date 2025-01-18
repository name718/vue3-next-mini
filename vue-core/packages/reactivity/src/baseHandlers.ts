// ProxyHandler ts中的类型

import { track, trigger } from './effect'

function createGetter() {
  return function get(target: object, key: string | symbol, reactiver: object) {
    const res = Reflect.get(target, key, reactiver)
    track(target, key)
    return res
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    reactiver: object
  ) {
    const result = Reflect.set(target, key, value, reactiver)
    trigger(target, key, value)
    return result
  }
}
const set = createSetter()
const get = createGetter()

export const mutableHandlers: ProxyHandler<object> = {
  set,
  get
}
