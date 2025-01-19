import { createDep, Dep } from './deps'
import { activeEffect, trackEffects, triggerEffects } from './effect'
import { toReactive } from './reactive'
import { hasChanged } from '@vue/shared'
export interface Ref<T = any> {
  value: T
}
export function ref(value?: unknown) {
  return createRef(value, false)
}

export function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) return rawValue

  return new RefImpl(rawValue, shallow)
}

export function isRef(r: any) {
  return !!(r && r.__v_isRef === true)
}

export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

export function triggerRefValue(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}
class RefImpl<T> {
  private _value: T
  private _rawValue: T
  public readonly __v_isRef = true
  public dep?: Dep = undefined
  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._value = __v_isShallow ? value : toReactive(value)
    this._rawValue = value
  }

  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._rawValue = newValue
      this._value = toReactive(newValue)
      triggerRefValue(this)
    }
  }
  get value() {
    trackRefValue(this)
    return this._value
  }
}
