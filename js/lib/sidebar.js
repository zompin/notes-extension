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
        this.settings = document.getElementById('settings')
        this.editorWrapper = document.getElementById('editor-wrapper')
        this.addButton = document.getElementById('add-button')
        this.backButton = document.getElementById('back-button')
        this.settingsButton = document.getElementById('settings-button')
        this.closeButton = document.getElementById('close-button')
        this.exportButton = document.getElementById('export')
        this.importField = document.getElementById('import')
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
        this.settingsButton.addEventListener('click', this.showSettings.bind(this))
        this.closeButton.addEventListener('click', this.closeSettings.bind(this))
        this.exportButton.addEventListener('click', this.exportData.bind(this))
        this.importField.addEventListener('change', this.importData.bind(this))
        document.addEventListener('keyup', this.handleEscape.bind(this))
    }

    addOrUpdateNote(note) {
        let item = this.list.querySelector(`button[data-id="${note.created}"]`)
        const content = note.content.replace(/<div>-{5,}.*/, '')

        if (!item) {
            item = document.createElement('button')
            item.classList.add('list-item')
            item.setAttribute('data-id', note.created)
            this.list.append(item)
        } else {
            this.list.firstChild.before(item)
        }

        item.textContent = sanitize(content)
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

    async handleChange(e) {
        const tmp = this.editor.innerHTML

        if (tmp === '<br>' || tmp === '<div><br></div>') {
            this.editor.innerHTML = ''
        }

        this.current = this.current || {}

        if (this.current.content === this.editor.innerHTML) {
            return
        }

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
        this.settingsButton.classList.add('show')
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
        this.settingsButton.classList.remove('show')
    }

    blur() {
        this.editor.blur()
        this.editor.contentEditable = 'false'
    }

    focus() {
        this.editor.contentEditable = 'true'

        if (!this.editor.innerHTML) {
            this.editor.focus()
            return
        }

        this.editor.scroll({
            top: this.editor.scrollHeight,
            left: 0,
            behavior: 'smooth'
        })

        const range = new Range()
        const pos = this.editor.childNodes.length

        range.setStart(this.editor, pos)
        range.setEnd(this.editor, pos - 1)
        getSelection().removeAllRanges()
        getSelection().addRange(range)
    }

    showSettings() {
        this.settings.classList.add('show')
    }

    closeSettings() {
        this.settings.classList.remove('show')
    }

    exportData() {
        const link = document.createElement('a')
        const blob = new Blob([JSON.stringify(this.items, null, '\t')], {type: 'text/json'})
        const objectURL = URL.createObjectURL(blob)

        link.download = 'notes.json'
        link.href = objectURL
        document.body.append(link)
        link.click()
        link.remove()
    }

    importData(e) {
        const reader = new FileReader()

        reader.onload = async (e) => {
            await this.api.importNotes(JSON.parse(e.target.result))
            await this.render()
        }

        reader.readAsText(e.target.files[0])
    }

    async render() {
        this.items = await this.api.load()
        this.items.sort((a, b) => new Date(b.updated) - new Date(a.updated))
        this.items.forEach(this.addOrUpdateNote.bind(this))
    }
}