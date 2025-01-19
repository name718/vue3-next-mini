export function isArray(target: any) {
  return Array.isArray(target)
}

export function isObject(target: any) {
  return target !== null && typeof target === 'object'
}

export function hasChanged(value: any, oldValue: any) {
  return !Object.is(value, oldValue)
}
