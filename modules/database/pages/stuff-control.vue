<template>
    <div>
        <div class="margin-bottom-2 margin-top-2 margin-right-2 d-flex justify-end">
            <button class="button button--large"
                    @click="showModal">
                {{ $t('action.add') }}
            </button>
        </div>
        <div class="p-relative">
            <div v-if="loading" class="table__initial-loading"></div>

            <vue-good-table
                    :columns="columns"
                    :rows="data"
                    @on-row-mouseenter="onRowMouseover"
                    @on-row-mouseleave="onRowMouseleave"
            >
                <template slot="table-row" slot-scope="props">
                    <span v-if="props.column.field === 'first_name'">
                        <a class="grid-view__row-more margin-right-2"
                           :class="{'visible': activeRow === props.row.id}"
                           @click="update(props.row)"
                        >
                            <i class="fas fa-expand"></i>
                          </a>
                        {{props.row.first_name}}
                    </span>

                    <span v-else-if="props.column.field === 'is_active'">
                        <Checkbox @input="(e) => changeStatus(e, props.row.id)"
                                  v-model="props.row.is_active"/>
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

        <create-user-modal
                :key="toUpdate.id? toUpdate.id: 'new'"
                :toUpdate="toUpdate"
                @userCreated="hideModal"
                @hidden="hidden"
                ref="selectModal"
        />
    </div>
</template>

<script>
  import stuffControlService from '@baserow/modules/database/services/stuff-control'
  import modal from '@baserow/modules/core/mixins/modal'
  import CreateUserModal from '@baserow/modules/database/components/modal/CreateUserModal'
  import Paginator from '@baserow/modules/core/components/Paginator'

  export default {
    name: 'stuff-control',
    middleware: 'staff',
    components: { CreateUserModal, Paginator },
    layout: 'app',
    mixins: [modal],
    data() {
      return {
        addUser: false,
        data: [],
        columns: [
          {
            label: 'First Name',
            field: 'first_name'
          },
          {
            label: 'Last Name',
            field: 'last_name'
          },
          {
            label: 'Username',
            field: 'username'
          },
          {
            label: 'Email',
            field: 'email'
          },
          {
            label: 'Active',
            field: 'is_active'
          }
        ],
        totalPages: 0,
        page: 1,
        limit: 10,
        offset: 0,
        loading: true,
        activeRow: null,
        toUpdate: {}
      }
    },
    mounted() {
      this.fetchFields(this.limit, this.offset)
    },
    methods: {
      onRowMouseover(params) {
        this.activeRow = params.row.id
      },
      onRowMouseleave() {
        this.activeRow = null
      },
      update(values) {
        this.showModal()
        this.toUpdate = {...values}
      },
      async fetchFields(limit, offset) {
        this.loading = true
        try {
          const table = await stuffControlService(this.$client).fetchAll(limit, offset)
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
      showModal() {
        this.$refs.selectModal.show()
        this.toUpdate = {}
      },
      hideModal() {
        this.$refs.selectModal.hide()
        this.fetchFields(this.limit, this.offset)
        this.toUpdate = {}
      },
      hidden() {
        this.toUpdate = {}
      },
      async changeStatus(e, id) {
        this.loading = true
        try {
          const response = await stuffControlService(this.$client).update({
            is_active: e
          }, id)
          this.fetchFields(this.limit, this.offset)
          this.loading = false
        } catch (e) {
          this.loading = false
        }
      }
    }
  }
</script>

<style lang="scss" src="../../core/assets/scss/good-table.scss"/>