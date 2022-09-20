export default (client) => {
  return {
    fetchAll(limit, offset) {
      const params = new URLSearchParams()
      params.append('limit', limit)
      params.append('offset', offset)
      const config = { params }

      return client.get(`/t2/staff-control/`, config)
    },
    create(values) {
      return client.post(`/t2/staff-control/`, values)
    },
    updateWithValidation(values, id) {
      return client.put(`/t2/staff-control/${id}/`, values)
    },
    update(values, id) {
      return client.patch(`/t2/staff-control/${id}/`, values)
    },
  }
}