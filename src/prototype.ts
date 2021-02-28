export function defineProperty(target: any, name: string, f: any) {
  if (target[name]) return

  Object.defineProperty(target, name, {
    enumerable: false,
    configurable: false,
    writable: false,
    value: f,
  })
}

const unique = function (this: Array<any>) {
  return Array.from(new Set(this))
}
defineProperty(Array.prototype, 'unique', unique)
