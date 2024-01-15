import {addNote, getAllNotes, updateNote, deleteNote} from '../js/lib.js'

const content = document.getElementById('content')
const addButton = document.getElementById('add-button')
const backButton = document.getElementById('back-button')
const list = document.getElementById('list')
const editor = document.getElementById('editor')

let currentNote = null

addButton.addEventListener('click', () => {
    currentNote = null
    editor.innerHTML = ''
    content.classList.add('content_editor-visible')
    editor.focus()
})

backButton.addEventListener('click', () => {
    content.classList.remove('content_editor-visible')
})

function debounce(callback) {
    let timer = 0

    return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(() => callback(...args), 150)
    }
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
            deleteNote(currentNote)
            currentNote = null
        }

        return
    }

    if (!currentNote) {
        currentNote = await addNote({ content })
        addNoteAtList(currentNote)
    } else {
        currentNote = await updateNote({ ...currentNote, content })
        updateNoteAtTree(currentNote)
    }
}

const handleKeyUpDebounced = debounce(handleKeyUp)
editor.addEventListener('keyup', handleKeyUpDebounced)

function sanitize(str) {
    const tmp = document.createElement('div')
    tmp.innerHTML = str

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
    const item = list.querySelector(`button[data-id="${note.created}"]`)

    if (!item) {
        return
    }

    item.remove()
}

getAllNotes().then(notes => {
    notes.forEach(addNoteAtList)
})

list.addEventListener('click', async e => {
    const id = e.target.getAttribute('data-id')

    if (!id) {
        return
    }

    const note = (await getAllNotes()).find(n => n.created === id)

    if (!note) {
        return
    }

    currentNote = note
    editor.innerHTML = note.content
    content.classList.add('content_editor-visible')
    editor.focus()
})

document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
        content.classList.remove('content_editor-visible')
    }
})