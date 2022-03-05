
type Code = 'ArrowDown' | 'ArrowUp' | 'ArrowLeft' | 'ArrowRight'
type Mask = '*' | Code | Code[] | RegExp

type Listener = [
  Mask,
  ((event: KeyboardEvent) => void) | null | undefined,
]

type Options = Partial<{
  element: HTMLElement
  onDown: Listener[]
}>

const testMask = (mask: Mask, str: string) => {
  if (mask === '*') {
    return true
  }
  if (mask instanceof RegExp) {
    return mask.test(str)
  }
  if (Array.isArray(mask)) {
    mask.includes(str as Code)
  }
  return mask === str
}

export const handleKeyboard = ({
  element = document.body,
  onDown,
}: Options) => {

  const onKeyPress = (event: KeyboardEvent): void => {
    const { code } = event
    if (onDown) {
      for (const [mask, callback] of onDown) {
        if (testMask(mask, code)) {
          callback?.(event)
        }
      }
    }
  }

  element.addEventListener('keydown', onKeyPress)
  
  const destroy = () => {    
    element.removeEventListener('keydown', onKeyPress)
  }

  return { destroy }
}