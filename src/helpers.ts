export function debounce(func: Function, wait: number, immediate: boolean, context: any): EventListener {
  let timeout: number = 0;
  return () => {
    const args = arguments;
    const later = () => {
      timeout = 0;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}