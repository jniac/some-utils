
const clamp = (x: number, min = 0, max = 1) => x < min ? min : x > max ? max : x
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const nothing = [][Symbol.iterator]()

/**
 * Clone a value. If value is an object will return a shallow clone.
 * Used by tween().
 */
const cloneValue = <T = any>(value: T) => {
  if (value && typeof value === 'object') {
    const clone = new (value as any).constructor()
    for (const key in value) {
      clone[key] = value[key]
    }
    return clone
  }
  return value
}

export const lerpObject = (receiver: any, a: any, b: any, t: number) => {
  for (const key in a) {
    const va = a[key]
    // some props may not be numeric, (ex: new THREE.Euler(0, 1, 2, 'XYZ'))
    if (typeof va === 'number') {
      const vb = b[key]
      receiver[key] = lerp(va, vb, t)
    }
  }
}

export const easing = {
  in2: (x: number) => x * x,
  in3: (x: number) => x * x * x,
  in4: (x: number) => x * x * x * x,
  in5: (x: number) => x * x * x * x * x,
  in6: (x: number) => x * x * x * x * x * x,
  out2: (x: number) => 1 - (x = 1 - x) * x,
  out3: (x: number) => 1 - (x = 1 - x) * x * x,
  out4: (x: number) => 1 - (x = 1 - x) * x * x * x,
  out5: (x: number) => 1 - (x = 1 - x) * x * x * x * x,
  out6: (x: number) => 1 - (x = 1 - x) * x * x * x * x * x,
}

let time = 0
let timeOld = 0
let deltaTime = 0
let frame = 0

type AnimationCallback = (animation: AnimationInstance) => any

class CallbackMap extends Map<AnimationInstance, Set<AnimationCallback>> {

  add(animation: AnimationInstance, cb: AnimationCallback) {
    const create = (animation: AnimationInstance) => {
      const set = new Set<AnimationCallback>()
      this.set(animation, set)
      return set
    }
    const set = this.get(animation) ?? create(animation)
    set.add(cb)
  }

  getAndDelete(animation: AnimationInstance) {
    const set = this.get(animation)
    if (set) {
      this.delete(animation)
    }
    return set
  }
}

const destroyCallbacks = new CallbackMap()
const completeCallbacks = new CallbackMap()
const frameCallbacks = new CallbackMap()
const nextFrameCallbacks = new CallbackMap()

let count = 0
class AnimationInstance {

  id = count++
  startTime = time
  startFrame = frame
  timeScale = 1
  paused = false
  time = 0
  timeOld = 0
  deltaTime = 0
  duration = Infinity
  destroyed = false
  frame = 0
  
  get normalizedTime() { return clamp(this.time, 0, this.duration) }
  get progress() { return clamp(this.time / this.duration, 0, 1) }
  get global() { return info }
  get complete() { return this.time >= this.duration }

  destroy: () => AnimationInstance
  
  constructor(cb?: AnimationCallback) {
    // destroy must be binded
    this.destroy = () => {
      if (this.destroyed === false) {
        destroyedAnimations.add(this)
        this.destroyed = true
      }
      return this
    }
    this.onFrame(cb)
    addAnimation(this)
  }

  onFrame(cb?: AnimationCallback) {
    if (this.destroyed === false && cb) {
      frameCallbacks.add(this, cb)
    }
    return this
  }

  onComplete(cb?: AnimationCallback) {
    if (this.destroyed === false && cb) {
      completeCallbacks.add(this, cb)
    }
    return this
  }

  onDestroy(cb?: AnimationCallback) {
    if (this.destroyed === false && cb) {
      destroyCallbacks.add(this, cb)
    }
    return this
  }
  
  waitDestroy() {
    if (this.destroyed) {
      return null
    }
    return new Promise<AnimationInstance>(resolve => destroyCallbacks.add(this, resolve))
  }
  
  waitCompletion() {
    if (this.destroyed || this.complete) {
      return null
    }
    return new Promise<AnimationInstance>(resolve => completeCallbacks.add(this, resolve))
  }
  
  nextFrame() {
    if (this.destroyed) {
      return null
    }
    return new Promise<AnimationInstance>(resolve => nextFrameCallbacks.add(this, resolve))
  }
  
  async *frames(): AsyncGenerator<AnimationInstance, void, unknown> {
    while(await this.nextFrame()) {
      yield this
    }
  }

  async *[Symbol.asyncIterator]() {
    yield* this.frames()
  }
}

const animations = new Set<AnimationInstance>()
const newAnimations = new Set<AnimationInstance>()
const destroyedAnimations = new Set<AnimationInstance>()
const BREAK = Symbol('Animation.BREAK')

const addAnimation = (animation: AnimationInstance) => {
  (updating ? newAnimations : animations).add(animation)
}

const updateAnimation = (animation: AnimationInstance) => {
  animation.timeOld = animation.time
  animation.deltaTime = deltaTime * animation.timeScale
  animation.time += animation.deltaTime
  if (animation.time >= 0) {
    animation.frame += 1
    let done = false
    for (const cb of frameCallbacks.get(animation) ?? nothing) {
      done = (cb(animation) === BREAK) || done
    }
    for (const cb of nextFrameCallbacks.getAndDelete(animation) ?? nothing) {
      done = (cb(animation) === BREAK) || done
    }
    if (animation.complete) {
      for (const cb of completeCallbacks.get(animation) ?? nothing) {
        cb(animation)
      }
    }
    if (done || animation.complete) {
      animation.destroy()
    }
  }
}

const destroyAnimation = (animation: AnimationInstance) => {
  animations.delete(animation)
  frameCallbacks.delete(animation)
  nextFrameCallbacks.delete(animation)
  const set = destroyCallbacks.getAndDelete(animation)
  if (set) {
    for (const cb of set) {
      cb(animation)
    }
  }
}

let updating = false
const updateAnimations = () => {
  updating = true
  for (const animation of animations) {
    if (animation.destroyed === false && animation.paused === false) {
      updateAnimation(animation)
    }
  }
  for (const animation of destroyedAnimations) {
    destroyAnimation(animation)
  }
  destroyedAnimations.clear()
  for (const animation of newAnimations) {
    animations.add(animation)
  }
  updating = false
}

const _innerLoop = (ms: number): void => {
  window.requestAnimationFrame(_innerLoop)

  timeOld = time
  time = ms / 1e3
  deltaTime = time - timeOld
  frame++

  updateAnimations()
}

window.requestAnimationFrame(_innerLoop)



// API:

/**
 * Small utility to handle animation with target.
 * 
 * When an animation is "set()", it automatically checks for a previous and, if so, destroy it.
 */
class AnimationMap {
  map = new Map<any, AnimationInstance>()
  get(target: any) {
    return this.map.get(target)
  }
  set(target: any, animation: AnimationInstance) {
    this.map.get(target)?.destroy()
    this.map.set(target, animation)
    animation.onDestroy(() => {
      // IMPORTANT: check that animation has not been overrided before delete it
      if (this.map.get(target) === animation) {
        this.map.delete(target)
      }
    })
    return animation
  }
}
const loop = (cb: AnimationCallback) => new AnimationInstance(cb)

const loopMap = new AnimationMap()
const loopWithTarget = (target: any, cb: AnimationCallback) => {
  return loopMap.set(target, loop(cb))
}
const loopCancelTarget = (target: any) => {
  loopMap.get(target)?.destroy()
}

type TimingParam = 
  | { duration: number, delay?: number, immediate?: boolean }
  | [number, number?, boolean?]
  | number

const fromTimingParam = (timingParam: TimingParam) => {
  if (typeof timingParam === 'number') {
    return { duration: timingParam, delay: 0 }
  }
  if (Array.isArray(timingParam)) {
    const [duration, delay, immediate] = timingParam
    return { duration, delay, immediate }
  }
  return timingParam
}

const during = (timing: TimingParam, cb?: AnimationCallback) => {
  const animation = new AnimationInstance(cb)
  const { duration, delay = 0, immediate = false } = fromTimingParam(timing)
  animation.duration = duration
  animation.time = -delay
  if (immediate && cb) {
    cb(animation)
  }
  return animation
}

const duringMap = new AnimationMap()
const duringWithTarget = (target: any, timing: TimingParam, cb: AnimationCallback = () => {}) => {
  return duringMap.set(target, during(timing, cb))
}
const duringCancelTarget = (target: any) => {
  duringMap.get(target)?.destroy()
}

const wait = (duration: number) => during(duration).waitDestroy()!

type TweenParams<T> = {
  from?: T | Partial<Record<keyof T, number>>
  to?: T | Partial<Record<keyof T, number>>
  ease?: ((t: number) => number) | (keyof typeof easing)
  onChange?: AnimationCallback,
  onComplete?: AnimationCallback,
}

const safeEase = (ease?: ((t: number) => number) | (keyof typeof easing)) => {
  if (typeof ease === 'string') {
    return easing[ease]
  }
  if (typeof ease === 'function') {
    return ease
  }
  return (x: number) => x
}

const tween = <T>(target: T, timing: TimingParam, {
  from,
  to,
  ease,
  onChange,
  onComplete,
}: TweenParams<T>) => {
  
  const keys = new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})]) as Set<keyof T>
  
  const _from = Object.fromEntries([...keys].map(key => {
    const value = cloneValue(from?.[key] ?? target[key])
    return [key, value]
  })) as Record<keyof T, any>
  
  const _to = Object.fromEntries([...keys].map(key => {
    const value = cloneValue(to?.[key] ?? target[key])
    return [key, value]
  })) as Record<keyof T, any>

  const _ease = safeEase(ease)

  const anim = duringWithTarget(target, timing, ({ progress }) => {
    const t = _ease(progress)
    for (const key of keys) {
      const propValue = target[key]
      const propType = typeof propValue
      if (propType === 'number') {
        // numeric
        target[key] = lerp(_from[key], _to[key], t) as unknown as T[keyof T]
      } else if (propType === 'object') {
        // object
        lerpObject(target[key], _from[key], _to[key], t)
      }
    }
  })

  if (onChange) {
    anim.onFrame(onChange)
  }

  if (onComplete) {
    anim.onComplete(onComplete)
  }

  return anim
}

const info = {
  get time() { return time },
  get timeOld() { return timeOld },
  get deltaTime() { return deltaTime },
  get frame() { return frame },
  get targetCount() { return loopMap.map.size + duringMap.map.size },
}

export {
  count,
  info,
  BREAK,
  loop,
  loopWithTarget,
  loopCancelTarget,
  during,
  duringWithTarget,
  duringCancelTarget,
  wait,
  tween,
}

export type {
  AnimationInstance,
}
