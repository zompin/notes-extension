import { Api } from '../js/lib/api.js'
import {debounce} from '../js/lib/debounce.js'

const content = document.getElementById('content')
const addButton = document.getElementById('add-button')
const backButton = document.getElementById('back-button')
const list = document.getElementById('list')
const editor = document.getElementById('editor')
const api = new Api(browser.storage.local)
let currentNote = null

const handleKeyUpDebounced = debounce(handleKeyUp)

api.load().then(notes => notes.forEach(addNoteAtList))

function handleAddClick() {
    currentNote = null
    editor.innerHTML = ''
    content.classList.add('content_editor-visible')
    editor.focus()
}

function handleBackClick() {
    content.classList.remove('content_editor-visible')
}

async function handleKeyUp(e) {
    let content = e.target.innerHTML

    if (content === '<br>') {
        e.target.innerHTML = ''
        content = ''
    }

    if (!content) {
        if (currentNote) {
            deleteFromTree(currentNote)
            await api.remove(currentNote)
            currentNote = null
        }

        return
    }

    if (!currentNote) {
        currentNote = await api.addOrUpdate({ content })
        addNoteAtList(currentNote)
    } else {
        currentNote = await api.addOrUpdate({ ...currentNote, content })
        updateNoteAtTree(currentNote)
    }
}

function sanitize(str) {
    const tmp = document.createElement('div')
    tmp.innerHTML = str.replaceAll('</div><div>', '\n')

    return tmp.textContent
}

function addNoteAtList(note) {
    const item = document.createElement('button')
    item.textContent = sanitize(note.content)
    item.setAttribute('data-id', note.created)
    item.classList.add('list-item')
    list.append(item)
}

function updateNoteAtTree(note) {
    const item = list.querySelector(`button[data-id="${note.created}"]`)

    if (!item) {
        return
    }

    item.textContent = sanitize(note.content)
}

function deleteFromTree(note) {
    list.querySelector(`button[data-id="${note.created}"]`)?.remove()
}

async function handleItemClick(e) {
    const id = e.target.getAttribute('data-id')

    if (!id) {
        return
    }

    const note = (api.notes).find(n => n.created === id)

    if (!note) {
        return
    }

    currentNote = note
    editor.innerHTML = note.content
    content.classList.add('content_editor-visible')
    editor.focus()
}

function handleESCClick(e) {
    if (e.key === 'Escape') {
        content.classList.remove('content_editor-visible')
    }
}

addButton.addEventListener('click', handleAddClick)

backButton.addEventListener('click', handleBackClick)

editor.addEventListener('keyup', handleKeyUpDebounced)

list.addEventListener('click', handleItemClick)

document.addEventListener('keyup', handleESCClick)