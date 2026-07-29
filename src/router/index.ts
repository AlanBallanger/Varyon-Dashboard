import { createRouter, createWebHistory } from 'vue-router'
import AccueilView from '@/views/AccueilView.vue'
import LogsView from '@/views/LogsView.vue'
import JoueursView from '@/views/JoueursView.vue'
import ModsView from '@/views/ModsView.vue'
import ConsoleView from '@/views/ConsoleView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/accueil' },
    { path: '/accueil', name: 'accueil', component: AccueilView },
    { path: '/logs', name: 'logs', component: LogsView },
    { path: '/joueurs', name: 'joueurs', component: JoueursView },
    { path: '/mods', name: 'mods', component: ModsView },
    { path: '/console', name: 'console', component: ConsoleView },
    { path: '/spark', name: 'spark', component: PlaceholderView },
    { path: '/threads', name: 'threads', component: PlaceholderView },
    { path: '/world-save', name: 'world-save', component: PlaceholderView },
    { path: '/scheduler', name: 'scheduler', component: PlaceholderView },
  ],
})

export default router
