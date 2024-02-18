export function sanitizer() {
    const tmp = document.createElement('div')

    return (str) => {
        tmp.innerHTML = str.replaceAll('</div><div>', '\n')
        return tmp.textContent
    }
}
