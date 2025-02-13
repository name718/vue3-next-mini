# 编程范式

- 命令式编程
- 声明式编程

# 设计原则

- 项目成本
- 开发体验

# 编译时(直接渲染 html 标签)

- render 函数将 template 中的 html 编译成 render 函数，然后再运行时通过 render 挂载对应的 dom

# 运行时(使用 js 动态生成 html 标签)

# 编译 + 运行

- 初次渲染
- 更新渲染

# 副作用

- setter 和 getter 所产生的

# 阅读源码

- 不要看边缘情况
- 更随一条主线

# 第四章

## 响应式数据

> 影响视图变化的数据

## js 的程序性

> 固定的程序流程

## definedProptype

> - 指定对象的指定 key
> - 不能监听数组或新增 obj 属性

## Proxy

> - 对整个对象进行监听

## Reflect

> - 第三个参数会改变 getter 的 this

```js
const obj = {
  a: 1,
  b: 2,
  get fullName() {
    return this.a + this.b;
  },
};
const p = new Proxy(obj, {
  get(target, key, receiver) {
    // return obj[key];
    return Reflect.get(target, key, receiver); // 3次
  },
});

console.log(p.fullName); // 应该出发三次，但是只有一次
```

## 触发依赖

## 收集依赖

## effect 是如何准确的 fn 和哪个对象的哪个属性绑定起来呢

![alt text](image.png)

## 结构之后是失去响应式的

## reactive 只有对象，不能代理简单的数据类型

## ref

### 如果是对象 其实是 reactive 逻辑，但是会同时触发 get 和 set

## ref 对于简单的数据类型，要主动触发 get value 和 set value，并不是响应式的

# computed

## 第一个参数是 getterOrOption 第二个参数是 setter

## 数据缓存是内部的脏变量控制

## computed 是懒执行的 脏数据-状态-缓存值 调度器

## 计算属性的缓存-先执行计算属性的 effect 然后在执行非计算属性的 effect

计算属性的缓存机制主要通过以下几个关键部分实现：

1. 在 `ComputedRefImpl` 类中：

```typescript:/Users/majuntao/Downloads/code/vue3-next-mini/vue-core/packages/reactivity/src/computed.ts
export class ComputedRefImpl<T> {
  private _dirty = true;      // 控制是否需要重新计算的标志
  private _value!: T;         // 缓存值

  constructor(getter) {
    // 创建 effect 实例，并传入调度器
    this.effect = new ReactiveEffect(getter, () => {
      // 当依赖的响应式数据变化时，将 _dirty 置为 true
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    // 脏数据时才重新计算
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;    // 计算完成后，将 _dirty 置为 false
    }
    return this._value;       // 返回缓存值
  }
}
```

2. 在 `effect.ts` 中的触发机制：

```typescript:/Users/majuntao/Downloads/code/vue3-next-mini/vue-core/packages/reactivity/src/effect.ts
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep];

  // 优先触发计算属性的更新
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect);
    }
  }
  // 再触发普通的 effect
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect);
    }
  }
}

export function triggerEffect(effect: ReactiveEffect) {
  // 如果有调度器，优先执行调度器
  if (effect.scheduler) {
    effect.scheduler();
  } else {
    effect.run();
  }
}
```

缓存机制的工作流程：

1. **初始化**：

   - 创建计算属性时，`_dirty` 初始为 `true`
   - `_value` 用于存储计算结果

2. **首次访问**：

   - 当 `_dirty` 为 `true` 时，执行计算
   - 将结果存储在 `_value` 中
   - 将 `_dirty` 设置为 `false`

3. **依赖更新**：

   - 当依赖的响应式数据变化时，调度器被触发
   - 调度器将 `_dirty` 设置为 `true`

4. **再次访问**：
   - 如果 `_dirty` 为 `false`，直接返回缓存的 `_value`
   - 如果 `_dirty` 为 `true`，重新计算并更新缓存

这种机制确保了：

- 计算属性只在必要时才重新计算
- 多次访问同一个计算属性时可以直接返回缓存值
- 依赖变化时能够正确地触发重新计算

# watch

- 1. watch -> doWatch -> 判断 ref -> 判断 reactive（默认 deep:true）-> job 函数
