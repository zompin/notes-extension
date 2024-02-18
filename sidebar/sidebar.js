import { Api } from '../js/lib/api.js'
import { Sidebar } from '../js/lib/sidebar.js'

const api = new Api(browser.storage.local)
const sidebar = new Sidebar(api)

sidebar.render()
