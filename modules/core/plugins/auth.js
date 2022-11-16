export default function ({ store }) {
  // If the user is authenticated, but is not refreshing in the browser means
  // that the refresh was done on the server side, so we need to manually start
  // the refreshing timeout here.
  if (
    store.getters['auth/isAuthenticated'] &&
    // @TODO Maybe replace this in the config with mode: 'client'.
    process.browser
  ) {
    store.dispatch('auth/startRefreshTimeout')
  }
}
