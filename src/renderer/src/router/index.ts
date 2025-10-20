/**
 * Vue Router Configuration
 *
 * Defines application routes and navigation
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'DirectorySelection',
    component: () => import('../views/DirectorySelection.vue'),
    meta: { title: 'Select Directory' }
  },
  {
    path: '/images',
    name: 'Images',
    component: () => import('../views/ImagesDashboard.vue'),
    meta: { title: 'Images & Videos' }
  },
  {
    path: '/audio',
    name: 'Audio',
    component: () => import('../views/AudioDashboard.vue'),
    meta: { title: 'Audio' }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('../views/NotesView.vue'),
    meta: { title: 'Notes' }
  },
  {
    path: '/party',
    name: 'Party',
    component: () => import('../views/PartyManagement.vue'),
    meta: { title: 'Party Management' }
  },
  {
    path: '/encounters',
    name: 'Encounters',
    component: () => import('../views/EncounterManagement.vue'),
    meta: { title: 'Encounters' }
  },
  {
    path: '/initiative',
    name: 'Initiative',
    component: () => import('../views/InitiativeTracker.vue'),
    meta: { title: 'Initiative Tracker' }
  },
  {
    path: '/battlemap',
    name: 'Battlemap',
    component: () => import('../views/BattlemapEditor.vue'),
    meta: { title: 'Battlemap Editor' }
  },
  {
    path: '/display',
    name: 'Display',
    component: () => import('../views/DisplayWindow.vue'),
    meta: { title: 'Display Window' }
  },
  // Redirect old dashboard to images
  {
    path: '/dashboard',
    redirect: '/images'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Navigation guard to update document title
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = `D&D Helper - ${title}`
  }
  next()
})

export default router
