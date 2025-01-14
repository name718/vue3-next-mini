// const target = {
//   a: 1,
// };

// const proxy = new Proxy(target, {
//   set(target, key, value, receiver) {
//     console.log("proxy");
//     target[key] = value;
//     return true;
//   },
// });

// proxy.a = 2;

// console.log(proxy, target);

// Reflect

const obj = {
  a: 1,
  b: 2,
  get fullName() {
    return this.a + this.b;
  },
};
const p = new Proxy(obj, {
  get(target, key, receiver) {
    return obj[key];
  },
});

console.log(p.fullName);
