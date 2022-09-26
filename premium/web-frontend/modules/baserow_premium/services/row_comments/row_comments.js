export default (client) => {
  return {
    fetchAll(tableId, rowId, { offset = 0, limit = 50 }) {
      return client.get(
        `/t2/row-comment/${tableId}/${rowId}/?offset=${offset}&limit=${limit}`
      )
    },
    create(tableId, rowId, comment) {
      return client.post(`/t2/row-comment/${tableId}/${rowId}/`, { comment })
    },
  }
}
