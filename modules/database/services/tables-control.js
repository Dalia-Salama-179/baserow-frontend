export default (client) => {
  return {
    fetchAll(limit, offset) {
      const params = new URLSearchParams()
      params.append('limit', limit)
      params.append('offset', offset)
      const config = { params }

      return client.get(`/t2/table-additional-data/`, config)
    },
    update(values, id) {
      return client.patch(`/t2/table-additional-data/${id}/`, values)
    }
  }
}