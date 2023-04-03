export default (client) => {
  return {
    fetchAll(tableId, rowId, { offset = 0, limit = 10 }) {
      return client.get(
        `/t2/row-comment/${tableId}/${rowId}/?offset=${offset}&limit=${limit}`
      )
    },
    create(tableId, rowId, comment) {
      return client.post(`/t2/row-comment/${tableId}/${rowId}/`, { comment })
    },
    fetchActivityLog(tableId, rowId, { offset = 0, limit = 10 }) {
      return client.get(
        `/t2/field-logs/?row=${rowId}&table=${tableId}&offset=${offset}&limit=${limit}`
        // `/t2/field-logs/?offset=${offset}&limit=${limit}`
      )
    },
  }
}
