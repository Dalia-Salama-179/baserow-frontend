import SettingsService from '@baserow/modules/core/services/settings'
import { clone } from '@baserow/modules/core/utils/object'

export const state = () => ({
  loaded: false,
  settings: {},
})

export const mutations = {
  SET_SETTINGS(state, values) {
    state.settings = values
  },
  UPDATE_SETTINGS(state, values) {
    state.settings = Object.assign({}, state.settings, values)
  },
  SET_LOADED(state, value) {
    state.loaded = value
  },
}

export const actions = {
  async load({ commit }) {
    const { data } = await SettingsService(this.$client).get()
    commit('SET_SETTINGS', data)
    commit('SET_LOADED', true)
  },
  async update({ commit, getters }, values) {
    const oldValues = clone(getters.get)
    commit('UPDATE_SETTINGS', values)

    try {
      await SettingsService(this.$client).update(values)
    } catch (e) {
      commit('SET_SETTINGS', oldValues)
      throw e
    }
  },
}

export const getters = {
  isLoaded(state) {
    return state.loaded
  },
  get(state) {
    return state.settings
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
