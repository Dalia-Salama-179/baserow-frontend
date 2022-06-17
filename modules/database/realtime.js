import { clone } from '@baserow/modules/core/utils/object'
import { anyFieldsNeedFetch } from '@baserow/modules/database/store/field'

/**
 * Registers the real time events related to the database module. When a message comes
 * in, the state of the stores will be updated to match the latest update. In some
 * cases some other events like refreshing all the data needs to be triggered.
 */
export const registerRealtimeEvents = (realtime) => {
  realtime.registerEvent('table_created', ({ store }, data) => {
    const database = store.getters['application/get'](data.table.database_id)
    if (database !== undefined) {
      store.dispatch('table/forceCreate', { database, data: data.table })
    }
  })

  realtime.registerEvent('table_updated', ({ store }, data) => {
    const database = store.getters['application/get'](data.table.database_id)
    if (database !== undefined) {
      const table = database.tables.find((table) => table.id === data.table.id)
      if (table !== undefined) {
        store.dispatch('table/forceUpdate', {
          database,
          table,
          values: data.table,
        })
      }
    }
  })

  realtime.registerEvent('tables_reordered', ({ store, app }, data) => {
    const database = store.getters['application/get'](data.database_id)
    if (database !== undefined) {
      store.commit('table/ORDER_TABLES', { database, order: data.order })
    }
  })

  realtime.registerEvent('table_deleted', ({ store }, data) => {
    const database = store.getters['application/get'](data.database_id)
    if (database !== undefined) {
      const table = database.tables.find((table) => table.id === data.table_id)
      if (table !== undefined) {
        store.dispatch('table/forceDelete', { database, table })
      }
    }
  })

  realtime.registerEvent('field_created', ({ store, app }, data) => {
    const table = store.getters['table/getSelected']
    const registry = app.$registry
    const fieldType = registry.get('field', data.field.type)
    if (table !== undefined && table.id === data.field.table_id) {
      const relatedFields = data.related_fields
      const callback = async () => {
        await store.dispatch('field/forceCreate', {
          table,
          values: data.field,
          relatedFields,
        })
      }
      const view = store.getters['view/getSelected']
      const viewMustBeRefreshed =
        view &&
        app.$registry
          .get('view', view.type)
          .shouldRefreshWhenFieldCreated(
            app.$registry,
            store,
            data.field,
            'page/'
          )
      if (
        fieldType.shouldFetchDataWhenAdded() ||
        anyFieldsNeedFetch(relatedFields, registry) ||
        viewMustBeRefreshed
      ) {
        app.$bus.$emit('table-refresh', {
          tableId: store.getters['table/getSelectedId'],
          newField: data.field,
          includeFieldOptions: true,
          callback,
        })
      } else {
        callback()
      }
    }
  })

  realtime.registerEvent('field_restored', async ({ store, app }, data) => {
    const table = store.getters['table/getSelected']
    if (table !== undefined && table.id === data.field.table_id) {
      // Trigger a table refresh to get the row data for the field including field
      // options to get those also.
      await store.dispatch('field/forceUpdateFields', {
        fields: data.related_fields,
      })
      app.$bus.$emit('table-refresh', {
        tableId: store.getters['table/getSelectedId'],
        includeFieldOptions: true,
        async callback() {
          await store.dispatch('field/fieldRestored', {
            table,
            selectedView: store.getters['view/getSelected'],
            values: data.field,
          })
        },
      })
    }
  })

  realtime.registerEvent('field_updated', ({ store, app }, data) => {
    const field = store.getters['field/get'](data.field.id)
    if (field !== undefined) {
      const oldField = clone(field)
      // We want to wait for the table to reload before actually updating the field
      // in order to prevent incompatible values for the field.
      const callback = async () => {
        await store.dispatch('field/forceUpdate', {
          field,
          oldField,
          data: data.field,
          relatedFields: data.related_fields,
        })
      }
      if (store.getters['table/getSelectedId'] === data.field.table_id) {
        app.$bus.$emit('table-refresh', {
          callback,
          tableId: store.getters['table/getSelectedId'],
        })
      } else {
        // If the current page is not the table we don't have to wait for the
        // refresh so we can update the field right away.
        callback()
      }
    }
  })

  realtime.registerEvent('field_deleted', async ({ store, app }, data) => {
    const field = store.getters['field/get'](data.field_id)
    if (field !== undefined) {
      await store.dispatch('field/forceDelete', field)
      if (store.getters['table/getSelectedId'] === data.table_id) {
        await store.dispatch('field/forceUpdateFields', {
          fields: data.related_fields,
        })
        app.$bus.$emit('table-refresh', {
          tableId: store.getters['table/getSelectedId'],
        })
      }
    }
  })

  realtime.registerEvent('row_created', (context, data) => {
    const { app, store } = context
    for (const viewType of Object.values(app.$registry.getAll('view'))) {
      viewType.rowCreated(
        context,
        data.table_id,
        store.getters['field/getAll'],
        store.getters['field/getPrimary'],
        data.row,
        data.metadata,
        'page/'
      )
    }
  })

  realtime.registerEvent('rows_created', (context, data) => {
    const { app, store } = context
    for (const viewType of Object.values(app.$registry.getAll('view'))) {
      for (let i = 0; i < data.rows.length; i++) {
        viewType.rowCreated(
          context,
          data.table_id,
          store.getters['field/getAll'],
          store.getters['field/getPrimary'],
          data.rows[i],
          data.metadata,
          'page/'
        )
      }
    }
  })

  realtime.registerEvent('row_updated', async (context, data) => {
    const { app, store } = context
    for (const viewType of Object.values(app.$registry.getAll('view'))) {
      await viewType.rowUpdated(
        context,
        data.table_id,
        store.getters['field/getAll'],
        store.getters['field/getPrimary'],
        data.row_before_update,
        data.row,
        data.metadata,
        'page/'
      )
    }

    store.dispatch('rowModal/updated', {
      tableId: data.table_id,
      values: data.row,
    })
  })

  realtime.registerEvent('rows_updated', async (context, data) => {
    // TODO: Rewrite
    // This is currently a naive implementation of batch rows updates.
    const { app, store } = context
    for (const viewType of Object.values(app.$registry.getAll('view'))) {
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i]
        const rowBeforeUpdate = data.rows_before_update[i]

        await viewType.rowUpdated(
          context,
          data.table_id,
          store.getters['field/getAll'],
          store.getters['field/getPrimary'],
          rowBeforeUpdate,
          row,
          data.metadata,
          'page/'
        )
      }
    }
    for (let i = 0; i < data.rows.length; i++) {
      store.dispatch('rowModal/updated', { values: data.rows[i] })
    }
  })

  realtime.registerEvent('row_deleted', (context, data) => {
    const { app, store } = context
    for (const viewType of Object.values(app.$registry.getAll('view'))) {
      viewType.rowDeleted(
        context,
        data.table_id,
        store.getters['field/getAll'],
        store.getters['field/getPrimary'],
        data.row,
        'page/'
      )
    }
  })

  realtime.registerEvent('rows_deleted', (context, data) => {
    const { app, store } = context
    for (const viewType of Object.values(app.$registry.getAll('view'))) {
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i]
        viewType.rowDeleted(
          context,
          data.table_id,
          store.getters['field/getAll'],
          store.getters['field/getPrimary'],
          row,
          'page/'
        )
      }
    }
  })

  realtime.registerEvent('view_created', ({ store }, data) => {
    if (store.getters['table/getSelectedId'] === data.view.table_id) {
      store.dispatch('view/forceCreate', { data: data.view })
    }
  })

  realtime.registerEvent('view_updated', (context, data) => {
    const { store, app } = context
    const view = store.getters['view/get'](data.view.id)
    if (view !== undefined) {
      const oldView = clone(view)
      store.dispatch('view/forceUpdate', { view, values: data.view })

      if (view.id === store.getters['view/getSelectedId']) {
        const viewType = app.$registry.get('view', view.type)
        const refresh = viewType.updated(context, view, oldView, 'page/')
        if (
          refresh ||
          view.filter_type !== oldView.filter_type ||
          view.filters_disabled !== oldView.filters_disabled
        ) {
          app.$bus.$emit('table-refresh', {
            tableId: store.getters['table/getSelectedId'],
          })
        }
      }
    }
  })

  realtime.registerEvent('views_reordered', ({ store, app }, data) => {
    const table = store.getters['table/getSelected']
    if (table !== undefined && table.id === data.table_id) {
      store.commit('view/ORDER_ITEMS', data.order)
    }
  })

  realtime.registerEvent('view_deleted', ({ store }, data) => {
    const view = store.getters['view/get'](data.view_id)
    if (view !== undefined) {
      store.dispatch('view/forceDelete', view)
    }
  })

  realtime.registerEvent('force_view_rows_refresh', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_id)
    if (view !== undefined) {
      if (store.getters['view/getSelectedId'] === view.id) {
        app.$bus.$emit('table-refresh', {
          tableId: store.getters['table/getSelectedId'],
        })
      }
    }
  })

  realtime.registerEvent('force_view_refresh', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_id)
    if (view !== undefined) {
      if (store.getters['view/getSelectedId'] === view.id) {
        app.$bus.$emit('table-refresh', {
          tableId: store.getters['table/getSelectedId'],
          includeFieldOptions: true,
          async callback() {
            await store.dispatch('field/forceSetFields', {
              fields: data.fields,
            })
          },
        })
      }
    }
  })

  realtime.registerEvent('view_filter_created', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_filter.view)
    if (view !== undefined) {
      store.dispatch('view/forceCreateFilter', {
        view,
        values: data.view_filter,
      })
      if (store.getters['view/getSelectedId'] === view.id) {
        app.$bus.$emit('table-refresh', {
          tableId: store.getters['table/getSelectedId'],
        })
      }
    }
  })

  realtime.registerEvent('view_filter_updated', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_filter.view)
    if (view !== undefined) {
      const filter = view.filters.find(
        (filter) => filter.id === data.view_filter.id
      )
      if (filter !== undefined) {
        store.dispatch('view/forceUpdateFilter', {
          filter,
          values: data.view_filter,
        })
        if (store.getters['view/getSelectedId'] === view.id) {
          app.$bus.$emit('table-refresh', {
            tableId: store.getters['table/getSelectedId'],
          })
        }
      }
    }
  })

  realtime.registerEvent('view_filter_deleted', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_id)
    if (view !== undefined) {
      const filter = view.filters.find(
        (filter) => filter.id === data.view_filter_id
      )
      if (filter !== undefined) {
        store.dispatch('view/forceDeleteFilter', { view, filter })
        if (store.getters['view/getSelectedId'] === view.id) {
          app.$bus.$emit('table-refresh', {
            tableId: store.getters['table/getSelectedId'],
          })
        }
      }
    }
  })

  realtime.registerEvent('view_sort_created', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_sort.view)
    if (view !== undefined) {
      store.dispatch('view/forceCreateSort', {
        view,
        values: data.view_sort,
      })
      if (store.getters['view/getSelectedId'] === view.id) {
        app.$bus.$emit('table-refresh', {
          tableId: store.getters['table/getSelectedId'],
        })
      }
    }
  })

  realtime.registerEvent('view_sort_updated', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_sort.view)
    if (view !== undefined) {
      const sort = view.sortings.find((sort) => sort.id === data.view_sort_id)
      if (sort !== undefined) {
        store.dispatch('view/forceUpdateSort', {
          sort,
          values: data.view_sort,
        })
        if (store.getters['view/getSelectedId'] === view.id) {
          app.$bus.$emit('table-refresh', {
            tableId: store.getters['table/getSelectedId'],
          })
        }
      }
    }
  })

  realtime.registerEvent('view_sort_deleted', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_id)
    if (view !== undefined) {
      const sort = view.sortings.find((sort) => sort.id === data.view_sort_id)
      if (sort !== undefined) {
        store.dispatch('view/forceDeleteSort', { view, sort })
        if (store.getters['view/getSelectedId'] === view.id) {
          app.$bus.$emit('table-refresh', {
            tableId: store.getters['table/getSelectedId'],
          })
        }
      }
    }
  })

  realtime.registerEvent('view_decoration_created', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_decoration.view)
    if (view !== undefined) {
      store.dispatch('view/forceCreateDecoration', {
        view,
        values: data.view_decoration,
      })
    }
  })

  realtime.registerEvent('view_decoration_updated', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_decoration.view)
    if (view !== undefined) {
      const decoration = view.decorations.find(
        (deco) => deco.id === data.view_decoration_id
      )
      if (decoration !== undefined) {
        store.dispatch('view/forceUpdateDecoration', {
          decoration,
          values: data.view_decoration,
        })
      }
    }
  })

  realtime.registerEvent('view_decoration_deleted', ({ store, app }, data) => {
    const view = store.getters['view/get'](data.view_id)
    if (view !== undefined) {
      const decoration = view.decorations.find(
        (deco) => deco.id === data.view_decoration_id
      )
      if (decoration !== undefined) {
        store.dispatch('view/forceDeleteDecoration', { view, decoration })
      }
    }
  })

  realtime.registerEvent('view_field_options_updated', (context, data) => {
    const { store, app } = context
    const view = store.getters['view/get'](data.view_id)
    if (view !== undefined && view.id === store.getters['view/getSelectedId']) {
      const viewType = app.$registry.get('view', view.type)
      viewType.fieldOptionsUpdated(context, view, data.field_options, 'page/')
    }
  })
}
