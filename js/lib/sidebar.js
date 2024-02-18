import {sanitizer} from "./sanitizer.js";

const sanitize = sanitizer()

const MODES = {
    PENDING: 'PENDING',
    LIST: 'LIST',
    EDIT: 'EDIT',
}

export class Sidebar {
    constructor(api) {
        this.list = document.getElementById('list')
        this.editor = document.getElementById('editor')
        this.editorWrapper = document.getElementById('editor-wrapper')
        this.addButton = document.getElementById('add-button')
        this.backButton = document.getElementById('back-button')
        this.current = null
        this.focused = null
        this.items = []
        this.api = api
        this.mode = MODES.LIST

        this.editorWrapper.addEventListener('transitionend', this.handleTransitionsEnd.bind(this))
        this.editor.addEventListener('keyup', this.handleChange.bind(this))
        this.list.addEventListener('click', this.handleSelect.bind(this))
        this.addButton.addEventListener('click', this.showEditor.bind(this))
        this.backButton.addEventListener('click', this.hideEditor.bind(this))
        document.addEventListener('keyup', this.handleEscape.bind(this))
    }

    addOrUpdateNote(note) {
        let item = this.list.querySelector(`button[data-id="${note.created}"]`)

        if (!item) {
            item = document.createElement('button')
            item.classList.add('list-item')
            item.setAttribute('data-id', note.created)
            this.list.append(item)
        }

        item.textContent = sanitize(note.content)
    }

    deleteNote(note) {
        this.list.querySelector(`button[data-id="${note.created}"]`)?.remove()
    }

    handleSelect(e) {
        const id = e.target.dataset.id
        const note = this.items.find(n => n.created === id)

        if (!note) {
            return
        }

        this.showEditor()
        this.current = note
        this.editor.innerHTML = note.content
    }

    async handleChange() {
        const tmp = this.editor.innerHTML

        if (tmp === '<br>' || tmp === '<div><br></div>') {
            this.editor.innerHTML = ''
        }

        this.current = this.current || {}
        this.current.content = this.editor.innerHTML

        if (this.editor.innerHTML) {
            this.current = await this.api.addOrUpdate(this.current)
            this.addOrUpdateNote(this.current)
        } else {
            this.api.remove(this.current)
            this.deleteNote(this.current)
            this.current = null
        }
    }

    handleTransitionsEnd(e) {
        if (this.editorWrapper.classList.contains('show')) {
            this.focus()
            this.mode = MODES.EDIT
        } else {
            this.mode = MODES.LIST
        }
    }

    handleEscape(e) {
        if (e.code === 'Escape' && this.mode === MODES.EDIT) {
            this.hideEditor()
        }
    }

    hideEditor() {
        this.mode = MODES.PENDING
        this.blur()
        this.editorWrapper.classList.remove('show')
        this.backButton.classList.remove('show')
        this.addButton.classList.add('show')
    }

    showEditor() {
        if (this.mode !== MODES.LIST) {
            return
        }

        this.mode = MODES.PENDING
        this.current = null
        this.editor.innerHTML = ''
        this.editorWrapper.classList.add('show')
        this.backButton.classList.add('show')
        this.addButton.classList.remove('show')
    }

    blur() {
        this.editor.blur()
        this.editor.contentEditable = 'false'
    }

    focus() {
        this.editor.contentEditable = 'true'
        this.editor.focus()

        this.editor.scroll({
            top: this.editor.scrollHeight,
            left: 0,
            behavior: 'smooth'
        })

        const range = new Range()
        const pos = this.editor.childNodes.length

        range.setStart(this.editor, pos)
        range.setEnd(this.editor, pos)
        getSelection().removeAllRanges()
        getSelection().addRange(range)
    }

    async render() {
        this.items = await this.api.load()
        this.items.forEach(this.addOrUpdateNote.bind(this))
    }
}