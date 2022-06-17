import { uuid } from '@baserow/modules/core/utils/string'
import { UNDO_REDO_STATES } from '@baserow/modules/core/utils/undoRedoConstants'

export const state = () => ({
  connecting: false,
  failedConnecting: false,
  authorizationError: false,
  copying: false,
  pasting: false,
  // See UNDO_REDO_STATES for all possible values.
  undoRedoState: UNDO_REDO_STATES.HIDDEN,
  items: [],
})

export const mutations = {
  ADD(state, notification) {
    state.items.unshift(notification)
  },
  REMOVE(state, notification) {
    const index = state.items.indexOf(notification)
    state.items.splice(index, 1)
  },
  SET_CONNECTING(state, value) {
    state.connecting = value
  },
  SET_FAILED_CONNECTING(state, value) {
    state.failedConnecting = value
  },
  SET_AUTHORIZATION_ERROR(state, value) {
    state.authorizationError = value
  },
  SET_COPYING(state, value) {
    state.copying = value
  },
  SET_PASTING(state, value) {
    state.pasting = value
  },
  SET_UNDO_REDO_STATE(state, value) {
    state.undoRedoState = value
  },
}

export const actions = {
  /**
   * Shows a notification message to the user.
   */
  add({ commit }, { type, title = null, message = null, data = null }) {
    commit('ADD', {
      id: uuid(),
      type,
      title,
      message,
      data,
    })
  },
  info({ dispatch }, { title, message }) {
    dispatch('add', { type: 'info', title, message })
  },
  error({ dispatch }, { title, message }) {
    dispatch('add', { type: 'error', title, message })
  },
  warning({ dispatch }, { title, message }) {
    dispatch('add', { type: 'warning', title, message })
  },
  success({ dispatch }, { title, message }) {
    dispatch('add', { type: 'success', title, message })
  },
  restore({ dispatch }, restoreData) {
    dispatch('add', {
      type: 'restore',
      data: restoreData,
    })
  },
  remove({ commit }, notification) {
    commit('REMOVE', notification)
  },
  setConnecting({ commit }, value) {
    if (value) {
      commit('SET_FAILED_CONNECTING', false)
    }
    commit('SET_CONNECTING', value)
  },
  setFailedConnecting({ commit }, value) {
    if (value) {
      commit('SET_CONNECTING', false)
    }
    commit('SET_FAILED_CONNECTING', value)
  },
  setAuthorizationError({ commit }, value) {
    commit('SET_AUTHORIZATION_ERROR', value)
  },
  setCopying({ commit }, value) {
    commit('SET_COPYING', value)
  },
  setPasting({ commit }, value) {
    commit('SET_PASTING', value)
  },
  setUndoRedoState({ commit }, value) {
    commit('SET_UNDO_REDO_STATE', value)
  },
}

export const getters = {
  undoRedoState(state) {
    return state.undoRedoState
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
