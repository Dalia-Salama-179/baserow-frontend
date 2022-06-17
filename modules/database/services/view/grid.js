import addPublicAuthTokenHeader from '@baserow/modules/database/utils/publicView'

export default (client) => {
  return {
    fetchRows({
      gridId,
      limit = 100,
      offset = null,
      signal = null,
      includeFieldOptions = false,
      includeRowMetadata = true,
      search = false,
      publicUrl = false,
      publicAuthToken = null,
      orderBy = '',
      filters = {},
      includeFields = [],
      excludeFields = [],
    }) {
      const include = []
      const params = new URLSearchParams()
      params.append('limit', limit)

      if (offset !== null) {
        params.append('offset', offset)
      }

      if (includeFieldOptions) {
        include.push('field_options')
      }

      if (includeRowMetadata) {
        include.push('row_metadata')
      }

      if (include.length > 0) {
        params.append('include', include.join(','))
      }

      if (search) {
        params.append('search', search)
      }

      if (orderBy) {
        params.append('order_by', orderBy)
      }

      if (includeFields.length > 0) {
        params.append('include_fields', includeFields.join(','))
      }

      if (excludeFields.length > 0) {
        params.append('exclude_fields', excludeFields.join(','))
      }

      Object.keys(filters).forEach((key) => {
        filters[key].forEach((value) => {
          params.append(key, value)
        })
      })

      const config = { params }

      if (signal !== null) {
        config.signal = signal
      }

      if (publicAuthToken) {
        addPublicAuthTokenHeader(config, publicAuthToken)
      }

      const url = publicUrl ? 'public/rows/' : ''
      return client.get(`/database/views/grid/${gridId}/${url}`, config)
    },
    fetchCount({
      gridId,
      search,
      signal = null,
      publicUrl = false,
      publicAuthToken = null,
      filters = {},
    }) {
      const params = new URLSearchParams()
      params.append('count', true)

      if (search) {
        params.append('search', search)
      }

      Object.keys(filters).forEach((key) => {
        filters[key].forEach((value) => {
          params.append(key, value)
        })
      })

      const config = { params }

      if (signal !== null) {
        config.signal = signal
      }

      if (publicAuthToken) {
        addPublicAuthTokenHeader(config, publicAuthToken)
      }

      const url = publicUrl ? 'public/rows/' : ''
      return client.get(`/database/views/grid/${gridId}/${url}`, config)
    },
    filterRows({ gridId, rowIds, fieldIds = null }) {
      const data = { row_ids: rowIds }

      if (fieldIds !== null) {
        data.field_ids = fieldIds
      }

      return client.post(`/database/views/grid/${gridId}/`, data)
    },
    fetchPublicViewInfo(viewSlug, publicAuthToken = null) {
      const config = {}
      if (publicAuthToken) {
        addPublicAuthTokenHeader(config, publicAuthToken)
      }
      return client.get(`/database/views/grid/${viewSlug}/public/info/`, config)
    },
    fetchFieldAggregations({ gridId, search, signal = null }) {
      const params = new URLSearchParams()

      if (search) {
        params.append('search', search)
      }

      const config = { params }

      if (signal !== null) {
        config.signal = signal
      }

      return client.get(`/database/views/grid/${gridId}/aggregations/`, config)
    },
  }
}
