const ROOT_KEY = 'notes'

export class Api {
    constructor(storage) {
        this.storage = storage
        this.notes = []
    }

    async addOrUpdate(note) {
        const now = new Date().toISOString()
        const index = this.notes.findIndex(n => n.created === note.created)

        if (index !== -1) {
            const tmp = {...note, updated: now}
            this.notes[index] = tmp
            await this.save()

            return tmp
        }
        const tmp = { ...note, updated: now, created: now }

        this.notes.push(tmp)
        await this.save()

        return tmp
    }

    async remove(note) {
        this.notes = this.notes.filter(n => n.created !== note.created)

        await this.save()
    }

    async load() {
        const {notes} = await this.storage.get(ROOT_KEY).catch(this.handleError) || {}
        this.notes = notes || []

        return this.notes
    }

    async save() {
        await this.storage.set({ [ROOT_KEY]: this.notes }).catch(this.handleError)
    }

    handleError(e) {
        console.log(e)
    }
}
