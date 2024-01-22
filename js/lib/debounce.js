export function debounce(callback) {
    let timer = 0

    return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(() => callback(...args), 150)
    }
}
