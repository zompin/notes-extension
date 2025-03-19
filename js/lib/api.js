const KEYS = 'KEYS'

export class Api {
    constructor(storage) {
        this.storage = storage
        this.notes = []
        this.keys = []
    }

    async addOrUpdate(note) {
        const now = new Date().toISOString()
        const index = this.notes.findIndex(n => n.created === note.created)
        const tmp = {...note}

        tmp.updated = now

        if (index === -1) {
            tmp.created = now

            this.keys.push(now)
            this.notes.push(tmp)
        } else {
            this.notes[index] = tmp
        }

        await Promise.all([
            index === -1 ? this.storage.set({[KEYS]: this.keys}).catch(this.handleError): null,
            this.storage.set({[tmp.created]: tmp}).catch(this.handleError)
        ])

        return tmp
    }

    async remove(note) {
        const foundNoteIndex = this.notes.findIndex(n => n.created === note.created)
        const foundKeyIndex = this.keys.findIndex(k => k === note.created)

        if (foundNoteIndex === -1 || foundKeyIndex === -1) {
            return
        }

        this.notes.splice(foundNoteIndex, 1)
        this.keys.splice(foundKeyIndex, 1)

        await Promise.all([
            this.storage.set({[KEYS]: this.keys}),
            this.storage.remove(note.created)
        ]).catch(this.handleError)
    }

    async importNotes(notes) {
        const keys = notes.map(n => n.created)

        for (let i = 0; i < notes.length; i += 10) {
            const obj = notes.slice(i, i + 10).reduce((acc, note) => {
                acc[note.created] = note

                return acc
            }, {})

            await this.storage.set(obj).catch(this.handleError)
        }

        this.storage.set({[KEYS]: keys}).catch(this.handleError)
    }

    async load() {
        this.keys = (await this.storage.get(KEYS))[KEYS] || []

        for (let i = 0; i < this.keys.length; i += 10) {
            const notes = await this.storage.get(this.keys.slice(i, i + 10)).catch(this.handleError)

            Object.values(notes).forEach(n => this.notes.push(n))
        }

        return this.notes
    }

    handleError(e) {
        console.log(e)
    }
}
