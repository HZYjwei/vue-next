import { track, trigger } from './effect'
import { OperationTypes } from './operations'
import { isObject } from '@vue/shared'
import { reactive } from './reactive'

export const refSymbol = Symbol(__DEV__ ? 'refSymbol' : undefined)

export interface Ref<T> {
  [refSymbol]: true
  value: UnwrapNestedRefs<T>
}

export type UnwrapNestedRefs<T> = T extends Ref<any> ? T : UnwrapRef<T>

// 转化为响应式监听对象
// proxy对象 || 原始值
const convert = (val: any): any => (isObject(val) ? reactive(val) : val)

// 这是通过比较设置get set 方法监听
// 将原始值转化为响应式监听对象
// eg： reactive(obj) 只能Proxy将对象类型转化为响应式监听对象
//      如果需要将基本数据类型转化为 响应式监听对象
//      就需要这个ref方法
//      const a = 1;
export function ref<T>(raw: T): Ref<T> {
  raw = convert(raw)
  const v = {
    [refSymbol]: true,
    get value() {
      track(v, OperationTypes.GET, '')
      return raw
    },
    set value(newVal) {
      raw = convert(newVal)
      trigger(v, OperationTypes.SET, '')
    }
  }
  return v as Ref<T>
}

export function isRef(v: any): v is Ref<any> {
  return v ? v[refSymbol] === true : false
}

// 将对象的所有值转化为ref对象
export function toRefs<T extends object>(
  object: T
): { [K in keyof T]: Ref<T[K]> } {
  const ret: any = {}
  for (const key in object) {
    ret[key] = toProxyRef(object, key)
  }
  return ret
}

// toPorxyRef 和 ref 唯一的区别就是 没有进行依赖收集
function toProxyRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): Ref<T[K]> {
  const v = {
    [refSymbol]: true,
    get value() {
      // 没有track
      return object[key]
    },
    set value(newVal) {
      // 没有trigger
      object[key] = newVal
    }
  }
  return v as Ref<T[K]>
}

// 不应该继续递归的引用数据类型
type BailTypes =
  | Function
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>

//这个数据可以是任意的类型，唯独不能是被嵌套了Ref类型的类型
// Recursively unwraps nested value bindings.
export type UnwrapRef<T> = {
  // 如果 是 Ref 类型 递归解套
  ref: T extends Ref<infer V> ? UnwrapRef<V> : T
  // 如果是 array<V> 递归解套
  array: T extends Array<infer V> ? Array<UnwrapRef<V>> : T
  // 如果是 对象 遍历解套
  object: { [K in keyof T]: UnwrapRef<T[K]> }
  // 否则停止解套
  stop: T
}[T extends Ref<any>
  ? 'ref'
  : T extends Array<any>
    ? 'array'
    : T extends BailTypes
      ? 'stop' // bail out on types that shouldn't be unwrapped
      : T extends object ? 'object' : 'stop']
