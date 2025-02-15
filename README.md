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

1. **入口函数 watch**：

```typescript
watch(source, callback, options);
```

2. **doWatch 处理流程**：

   - 判断数据源类型：
     - 如果是 ref，直接获取 `.value`
     - 如果是 reactive，默认进行深度监听（deep: true）
   - 创建 job 函数（用于处理回调）
   - 创建 effect 实例

3. **数据源处理**：

   - ref 类型：直接监听 `.value` 的变化
   - reactive 类型：
     - 深度监听：遍历对象的所有属性
     - 非深度监听：只监听对象本身

4. **调度器处理**：

   - 创建 scheduler 函数
   - 根据配置决定是否立即执行（immediate）
   - 处理防抖（debounce）和节流（throttle）

5. **回调执行**：
   - job 函数负责执行用户的回调
   - 传入新值和旧值
   - 处理清理函数（cleanup）

主要流程图：

```plaintext
watch
  ↓
doWatch
  ↓
判断数据源类型 → ref/reactive
  ↓
创建 job 函数
  ↓
创建 effect 实例
  ↓
根据 options 配置执行相应逻辑
  ↓
数据变化时触发 scheduler
  ↓
执行 job 函数
  ↓
调用用户回调
```

关键特点：

1. 支持多种数据源（ref、reactive、函数）
2. 可配置立即执行（immediate）
3. 支持深度监听（deep）
4. 可以处理清理函数
5. 支持异步执行（flush: 'post'）

这就是 watch 的主要执行流程。它通过响应式系统来追踪依赖变化，并在适当的时机触发用户的回调函数。

假设我们有如下代码：

```js
const count = ref(0);
effect(() => {
  console.log(count.value);
});
```

依赖收集的流程如下：

1. **创建 ref**：

```typescript
const count = ref(0);
// 内部会创建 RefImpl 实例
class RefImpl {
  private _value;
  public dep; // 存储依赖的容器

  constructor(value) {
    this._value = value;
    this.dep = new Set(); // 创建依赖集合
  }
}
```

2. **effect 执行**：

```typescript
effect(() => {
  // 1. 创建 ReactiveEffect 实例
  const _effect = new ReactiveEffect(fn);
  // 2. 设置当前活跃的 effect
  activeEffect = _effect;
  // 3. 执行用户传入的函数，这会触发 ref 的 get 操作
  _effect.run();
});
```

3. **触发 ref 的 get 操作**：

```typescript
class RefImpl {
  get value() {
    // 1. 触发依赖收集
    trackRefValue(this);
    // 2. 返回值
    return this._value;
  }
}

function trackRefValue(ref) {
  if (activeEffect) {
    // 将当前活跃的 effect 添加到 ref 的依赖集合中
    ref.dep.add(activeEffect);
  }
}
```

整个流程图：

```plaintext
创建 ref
  ↓
创建 effect
  ↓
设置 activeEffect
  ↓
执行用户函数
  ↓
访问 ref.value
  ↓
触发 trackRefValue
  ↓
将 effect 存储到 dep 中
```

这样，当 ref 的值发生变化时，就可以通过存储的 dep 找到所有相关的 effect 并触发更新。

关键点：

1. ref 通过 dep 存储依赖
2. effect 执行时会设置全局的 activeEffect
3. 访问 ref.value 时会触发依赖收集
4. 依赖收集就是将 activeEffect 存入 dep 中

这就是 ref 的依赖收集流程。这种机制确保了响应式系统能够准确地知道哪些 effect 依赖于哪些数据，从而在数据变化时精确地触发更新。
