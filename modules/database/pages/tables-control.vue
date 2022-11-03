<template>
    <div class="margin-top-4 margin-bottom-4">

        <div class="p-relative">
            <div v-if="loading" class="table__initial-loading"></div>

            <vue-good-table
                    :columns="columns"
                    :rows="data"
            >
                <template slot="table-row" slot-scope="props">
                    <span v-if="props.column.field === 'can_edit'">
                        <Checkbox @input="(e) => changeStatus(e, props.row.id)"
                                  v-model="props.row.can_edit"/>
                    </span>
                    <span v-else-if="props.column.field === 'created_on'">
                        {{ moment(props.row.created_on).format('DD/MM/YYYY')}}
                    </span>
                    <span v-else>
                      {{props.formattedRow[props.column.field]}}
                    </span>
                </template>

            </vue-good-table>
            <Paginator
                    class="margin-top-2 margin-left-2"
                    :total-pages="totalPages"
                    :page="page"
                    @change-page="fetch"
            ></Paginator>

        </div>
    </div>
</template>

<script>
  import tablesControlService from '@baserow/modules/database/services/tables-control'
  import Paginator from '@baserow/modules/core/components/Paginator'
  import moment from '@baserow/modules/core/moment'

  export default {
    name: 'tables-control',
    components: {Paginator},
    layout: 'app',
    data() {
      return {
        data: [],
        loading: true,
        columns: [
          {
            label: 'ID',
            field: 'table.id'
          },
          {
            label: 'Table',
            field: 'table.name'
          },
          {
            label: 'Editable',
            field: 'can_edit'
          },
          {
            label: 'Created At',
            field: 'created_on'
          },
        ],
        totalPages: 0,
        page: 1,
        limit: 10,
        offset: 0,
      }
    },
    mounted() {
      this.fetchFields(this.limit, this.offset)
    },
    methods: {
      async fetchFields(limit, offset) {
        this.loading = true
        try {
          const table = await tablesControlService(this.$client).fetchAll(limit, offset)
          this.data = table.data.results
          this.totalPages = Math.ceil(table.data.count / 10)
          this.loading = false
        } catch (e) {

        }
      },
      fetch(page) {
        if (page > this.page) this.offset = this.offset + this.limit
        else this.offset = this.offset - this.limit
        this.fetchFields(this.limit, this.offset)
        this.page = page
      },
      async changeStatus(e, id) {
        this.loading = true
        try {
          const response = await tablesControlService(this.$client).update({
            can_edit: e
          }, id)
          this.fetchFields(this.limit, this.offset)
          this.loading = false
          await this.$store.dispatch('tablesControl/setAll')
        } catch (e) {
          this.loading = false
        }
      },
      moment(...args) {
        return moment(...args)
      },
    }
  }
</script>

<style lang="scss" src="../../core/assets/scss/good-table.scss"/>