/**
 * This middleware makes sure the settings are fetched and available in the store.
 */
export default async function ({ store, req }) {
  // If nuxt generate, pass this middleware
  if (process.server && !req) return

  if (!store.getters['settings/isLoaded']) {
    await store.dispatch('settings/load')
  }
}
