import TablesControlServices from '../../database/services/tables-control'

export const state = () => ({
  items: [],
})

export const mutations = {
  SET_ITEMS(state, tables) {
    state.items = tables
  },
}

export const actions = {
  async setAll({ commit } ) {
    const { data } = await TablesControlServices(this.$client).fetchAll(1000, 0)
    commit('SET_ITEMS', data.results)
    if (process.client) {
      localStorage.setItem('AppTables', JSON.stringify(data.results))
    }
  }
}

export const getters = {
  getAll(state) {
    return state.items;
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
