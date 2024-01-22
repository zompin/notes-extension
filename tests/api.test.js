import { describe, expect, test, jest as jestForMock } from '@jest/globals';
import { Api} from "../js/lib/api.js";

const storage = {
    async get() {
        return { notes: [...this.notes] }
    },
    async set(obj) {
        this.notes = obj.notes
    },
}

const DateOrigin = Date

describe('api', () => {
    test('Get empty', async () => {
        const api = new Api(storage)
        await api.load()
        expect(storage.notes).toBe(undefined)
        expect(api.notes).toEqual([])
    })

    test('Add note', async () => {
        const dateString = "2024-01-21T12:52:28.804Z"
        const api = new Api(storage)
        const date = new DateOrigin(dateString)
        const res = [{"content": "Test content", "created": dateString, "updated": dateString}]

        jestForMock.spyOn(global, 'Date').mockImplementationOnce(() => date)
        expect(api.notes).toEqual([])
        expect(storage.notes).toEqual(undefined)
        await api.addOrUpdate({ content: 'Test content' })
        expect(api.notes).toEqual(res)
        expect(storage.notes).toEqual(res)
    })

    test('Update note', async () => {
        const api = new Api(storage)
        const date = new DateOrigin("2024-01-22T12:52:28.804Z")
        const res = [{"content": "Test content updated", "created": "2024-01-21T12:52:28.804Z", "updated": "2024-01-22T12:52:28.804Z"}]

        await api.load()
        expect(api.notes.length).toEqual(1)
        expect(storage.notes.length).toEqual(1)
        jestForMock.spyOn(global, 'Date').mockImplementationOnce(() => date)

        await api.addOrUpdate({ content: 'Test content updated', "created": "2024-01-21T12:52:28.804Z" })
        console.log(api.notes, storage.notes)
        expect(api.notes).toEqual(res)
        expect(storage.notes).toEqual(res)
        expect(api.notes.length).toEqual(1)
        expect(storage.notes.length).toEqual(1)
    })

    test('Remove note', async () => {
        const api = new Api(storage)
        await api.load()

        expect(api.notes.length).toBe(1)
        expect(storage.notes.length).toBe(1)

        await api.remove({ content: 'Test content updated', "created": "2024-01-21T12:52:28.804Z" })
        expect(api.notes.length).toBe(0)
        expect(storage.notes.length).toBe(0)
    })
})
