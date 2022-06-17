import setupCore from '@baserow/modules/core/plugin'
import axios from 'axios'
import setupClient from '@baserow/modules/core/plugins/clientHandler'
import setupDatabasePlugin from '@baserow/modules/database/plugin'
import { bootstrapVueContext } from '@baserow/test/helpers/components'
import MockAdapter from 'axios-mock-adapter'
import _ from 'lodash'
import { MockServer } from '@baserow/test/fixtures/mockServer'
import flushPromises from 'flush-promises'

/**
 * Uses the real baserow plugins to setup a Vuex store and baserow registry
 * correctly.
 */
function _createBaserowStoreAndRegistry(app, vueContext, extraPluginSetupFunc) {
  const store = new vueContext.vuex.Store({})

  setupCore({ store, app }, (name, dep) => {
    app[`$${name}`] = dep
  })
  setupClient({ store, app }, (key, value) => {
    app[key] = value
  })
  app.$client = app.client
  store.$registry = app.$registry
  store.$client = app.client
  store.app = app
  app.$store = store
  const setupContext = {
    store,
    app,
  }
  setupDatabasePlugin(setupContext)
  if (extraPluginSetupFunc) {
    extraPluginSetupFunc(setupContext)
  }
  return store
}

/**
 * An acceptance testing framework for testing Baserow components and surrounding logic
 * like stores.
 * TestApp sets up baserow components, registries and stores so they work out of the
 * box and can be tested without having to:
 *  - wait 30+ seconds for a Nuxt server to startup and build
 *  - mock out stores, registries or carve arbitrary boundaries in
 *    the tests causing problems when store and component logic is tightly
 *    coupled.
 *
 * To use create an instance of this class in your beforeAll
 * test suite hook and make sure to call testApp.afterEach() in the afterEach hook.
 *
 * The following attributes are exposed for use in your tests:
 * testApp.mockServer : a helper class providing methods to initialize a fake
 *                      baserow server with consistent test data.
 * testApp.mock       : a mock axios adapter used to mock out HTTP calls to the server,
 *                      also used by testApp.mockServer to actually do the server call
 *                      mocking.
 * testApp.store      : a Vuex store populated with Baserow's stores ready for you to
 *                      commit, get and dispatch to.
 * UIHelpers          : a collection of methods which know how to perform common actions
 *                      on Baserow's components.
 *
 */
export class TestApp {
  constructor(extraPluginSetupFunc = null) {
    this.mock = new MockAdapter(axios, { onNoMatch: 'throwException' })

    // Fix "scrollIntoViewError is not a function error"
    // as described here: https://github.com/jsdom/jsdom/issues/1695
    window.HTMLElement.prototype.scrollIntoView = function () {}

    // In the future we can extend this stub realtime implementation to perform
    // useful testing of realtime interaction in the frontend!
    this._realtime = {
      registerEvent(e, f) {},
      subscribe(e, f) {},
      connect(a, b) {},
      disconnect() {},
    }
    // Various stub and mock attributes which will be injected into components
    // mounted using TestApp.
    const cookieStorage = {}
    this.cookieStorage = cookieStorage
    this._app = {
      $realtime: this._realtime,
      $cookies: {
        set(name, id, value) {
          cookieStorage[name] = value
        },
        get(name) {
          return cookieStorage[name]
        },
      },
      $env: {
        PUBLIC_WEB_FRONTEND_URL: 'https://localhost/',
      },
      i18n: {
        t: (key) => key,
        tc: (key) => key,
      },
      $route: {
        params: {},
      },
      $featureFlags: { includes: () => true },
    }
    this._vueContext = bootstrapVueContext()
    this.store = _createBaserowStoreAndRegistry(
      this._app,
      this._vueContext,
      extraPluginSetupFunc
    )
    this._initialCleanStoreState = _.cloneDeep(this.store.state)
    this.mockServer = new MockServer(this.mock, this.store)
    this.failTestOnErrorResponse = true
    this._app.client.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        if (this.failTestOnErrorResponse) {
          fail(error)
        }
        return Promise.reject(error)
      }
    )
  }

  dontFailOnErrorResponses() {
    this.failTestOnErrorResponse = false
  }

  failOnErrorResponses() {
    this.failTestOnErrorResponse = true
  }

  /**
   * Cleans up after a test run performed by TestApp. Make sure you call this
   * in your test suits afterEach method!
   */
  async afterEach() {
    // Flushing promises should be done before the mock reset to avoid raising
    // unwanted exceptions
    await flushPromises()
    this.mock.reset()
    this.failOnErrorResponses()
    this.store.replaceState(_.cloneDeep(this._initialCleanStoreState))
    this._vueContext.teardownVueContext()
  }

  /**
   * Creates a fully rendered version of the provided Component and calls
   * asyncData on the component at the correct time with the provided params.
   */
  async mount(Component, { asyncDataParams = {}, ...kwargs }) {
    // Sometimes baserow directly appends to the documents body, ensure that we
    // are mounting into the document so we can correctly inspect the modals that
    // are placed there.
    const rootDiv = document.createElement('div')
    document.body.appendChild(rootDiv)

    if (Object.prototype.hasOwnProperty.call(Component, 'asyncData')) {
      const data = await Component.asyncData({
        store: this.store,
        params: asyncDataParams,
        error: fail,
        app: this._app,
      })
      Component.data = function () {
        return data
      }
    }
    const wrapper = this._vueContext.vueTestUtils.mount(Component, {
      localVue: this._vueContext.vue,
      mocks: this._app,
      attachTo: rootDiv,
      ...kwargs,
    })

    // The vm property doesn't alway exist. See https://vue-test-utils.vuejs.org/api/wrapper/#properties
    if (wrapper.vm) {
      await this.callFetchOnChildren(wrapper.vm)
    }
    return wrapper
  }

  async callFetchOnChildren(c) {
    if (c.$options.fetch) {
      const fetch = c.$options.fetch
      if (typeof fetch !== 'function') {
        throw new TypeError('fetch should be a function')
      }
      await c.$options.fetch.bind(c)()
    }
    for (const child of c.$children) {
      await this.callFetchOnChildren(child)
    }
  }
}
/**
 * Various helper functions which interact with baserow components. Lean towards
 * putting and sharing any test code which relies on specific details of how baserow
 * components are structured and styled in here This way there is a single place
 * to fix when changes are made to the components instead of 30 different test cases.
 */
export const UIHelpers = {
  async performSearch(tableComponent, searchTerm) {
    await tableComponent.get('i.header__search-icon').trigger('click')
    const searchBox = tableComponent.get(
      'input[placeholder*="viewSearchContext.searchInRows"]'
    )
    await searchBox.setValue(searchTerm)
    await searchBox.trigger('submit')
    await flushPromises()
  },
  async startEditForCellContaining(tableComponent, htmlInsideCellToSearchFor) {
    const targetCell = tableComponent
      .findAll('.grid-view__cell')
      .filter((w) => w.html().includes(htmlInsideCellToSearchFor))
      .at(0)

    await targetCell.trigger('click')

    const activeCell = tableComponent.get('.grid-view__cell.active')
    // Double click to start editing cell
    await activeCell.trigger('click')
    await activeCell.trigger('click')

    return activeCell.find('input')
  },
}
