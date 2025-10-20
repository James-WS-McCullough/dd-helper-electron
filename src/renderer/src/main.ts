import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.css'
import {
  useDirectoryStore,
  useDisplayStore,
  usePartyStore,
  useEncounterStore,
  useInitiativeStore,
  useBattlemapStore
} from './stores'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize stores after mounting
app.mount('#app')

// Initialize all stores with data from main process
async function initializeStores(): Promise<void> {
  const directoryStore = useDirectoryStore()
  const displayStore = useDisplayStore()
  const partyStore = usePartyStore()
  const encounterStore = useEncounterStore()
  const initiativeStore = useInitiativeStore()
  const battlemapStore = useBattlemapStore()

  // Initialize directory first (other stores depend on it)
  await directoryStore.initialize()

  // Initialize other stores in parallel
  await Promise.all([
    displayStore.initialize(),
    partyStore.initialize(),
    encounterStore.initialize(),
    initiativeStore.initialize(),
    battlemapStore.initialize()
  ])

  console.log('All stores initialized')
}

// Start initialization
initializeStores().catch((error) => {
  console.error('Failed to initialize stores:', error)
})
