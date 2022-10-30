<!-- edited By Ahmed Elsayed -->
<template>
  <RowEditModal
    ref="modal"
    :read-only="false"
    :table="table"
    :rows="[]"
    :visible-fields="fields"
    :primary="primary"
    @update="udate"
    @hidden="$emit('hidden', $event)"
  ></RowEditModal>
</template>

<script>
import { DatabaseApplicationType } from '@baserow/modules/database/applicationTypes'
import RowEditModal from '@baserow/modules/database/components/row/RowEditModal'
import FieldService from '@baserow/modules/database/services/field'
import RowService from '@baserow/modules/database/services/row'
import { populateField } from '@baserow/modules/database/store/field'
import { notifyIf } from '@baserow/modules/core/utils/error'
/**
 * This component can open the row edit modal having the fields of that table in the
 * fields store. It will make a request to the backend fetching the missing
 * information.
 */
export default {
  name: 'ForeignRowEditModal',
  components: { RowEditModal },
  props: {
    tableId: {
      type: Number,
      required: true,
    },
    view: {
      type: Object
    },
    outerRow: {
      type: Object
    },
  },
  data() {
    return {
      fetchedTableAndFields: false,
      table: {},
      fields: [],
      primary: undefined,
    }
  },
  methods: {
   async udate(event){

      let objs ={}
      objs[`field_${event.field.id}`] = event.value
      // const { data } = await RowService(this.$client).update(
      //     event.table.id,
      //     event.row.id,
      //     objs
      // )
     try {
       await this.$store.dispatch(
               'page/view/grid/updateForeignRowValue', {
                 table: this.table,
                 view: this.view,
                 fields: this.fields,
                 primary: this.primary,
                 row: this.outerRow,
                 field: event.field,
                 value: event.value,
                 oldValue: event.oldValue,
                 values: objs
               }
       )
     } catch (error) {
       notifyIf(error, 'field')
     }
    },
    async fetchTableAndFields() {
      // Find the table in the applications to prevent a request to the backend and to
      // maintain reactivity with the real time updates.
      const databaseType = DatabaseApplicationType.getType()
      for (const application of this.$store.getters['application/getAll']) {
        if (application.type !== databaseType) {
          continue
        }

        const foundTable = application.tables.find(
          ({ id }) => id === this.tableId
        )

        if (foundTable) {
          this.table = foundTable
          break
        }
      }

      // Because we don't have the fields in the store we need to fetch those for this
      // table.
      const { data: fieldData } = await FieldService(this.$client).fetchAll(
        this.tableId
      )
      fieldData.forEach((part, index) => {
        populateField(fieldData[index], this.$registry)
      })
      const primaryIndex = fieldData.findIndex((item) => item.primary === true)
      if (primaryIndex !== -1) {
        this.primary = fieldData.splice(primaryIndex, 1)[0]
        this.fields = [this.primary, ...fieldData]
      } else {
        this.fields = fieldData
      }

      // Mark the table and fields as fetched, so that we don't have to do that a
      // second time when the user opens another row.
      this.fetchedTableAndFields = true
    },

    async show(rowId) {
      if (!this.fetchedTableAndFields) {
        await this.fetchTableAndFields()
      }

      const { data: rowData } = await RowService(this.$client).get(
        this.tableId,
        rowId
      )
      this.$refs.modal.show(rowData.id, rowData)
    },
  },
}
</script>
