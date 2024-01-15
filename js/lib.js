const storage = browser.storage.local;

const ROOT_KEY = 'notes'
let allNotesCache = []

export async function getAllNotes() {
    const store = await storage.get(ROOT_KEY)

    if (allNotesCache.length) {
        return allNotesCache
    }

    if (Array.isArray(store.notes)) {
        allNotesCache = store.notes
        return store.notes
    }

    return []
}

export async function saveAllNotes(notes) {
    allNotesCache = notes
    await storage.set({ [ROOT_KEY]: notes })
}

export async function addNote(note) {
    const created = new Date().toISOString()
    const tmp = { ...note, created, updated: created }
    const notes = await getAllNotes()
    notes.push(tmp)
    saveAllNotes(notes)

    return tmp
}

export async function updateNote(note) {
    const updated = new Date().toISOString()
    const tmp = { ...note, updated }
    const notes = await getAllNotes()
    const index = notes.findIndex(n => n.created === note.created)

    if (index !== -1) {
        notes[index] = tmp
    }

    saveAllNotes(notes)

    return tmp
}

export async function deleteNote(note) {
    const notes = (await getAllNotes()).filter(n => n.created !== note.created)
    saveAllNotes(notes)
}
