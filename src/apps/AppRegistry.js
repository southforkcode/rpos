/**
 * Application Registry
 * Central registry for all applications in the OS
 */

import SettingsApp from './SettingsApp.vue'
import DiceRollerApp, { diceRollerHelpContent } from './DiceRollerApp.vue'
import JournalApp, { journalHelpContent } from './JournalApp.vue'

// Attach help content to components
DiceRollerApp.helpContent = diceRollerHelpContent
JournalApp.helpContent = journalHelpContent

const applications = [
  {
    id: 'settings',
    name: 'Settings',
    icon: 'pi pi-cog',
    component: SettingsApp,
    defaultWidth: 700,
    defaultHeight: 600,
    minWidth: 500,
    minHeight: 400
  },
  {
    id: 'dice-roller',
    name: 'Dice Roller',
    icon: 'pi pi-stop',
    component: DiceRollerApp,
    defaultWidth: 600,
    defaultHeight: 700,
    minWidth: 500,
    minHeight: 500
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: 'pi pi-book',
    component: JournalApp,
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 500,
    minHeight: 400
  }
]

export function registerApplications(osStore) {
  applications.forEach(app => {
    osStore.registerApplication(app)
  })
}

export default applications

