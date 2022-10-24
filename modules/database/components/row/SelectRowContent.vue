<!-- edited By Ahmed Elsayed -->
<template>
  <div>
    <div v-if="!loaded" class="select-row-modal__initial-loading"></div>
    <div v-if="loaded" :class="{ 'select-row-modal__loading': loading }">
      <Scrollbars
        v-show="!openForm"
        ref="scrollbars"
        horizontal="getHorizontalScrollbarElement"
        :style="{ left: '240px' }"
        @horizontal="horizontalScroll"
      ></Scrollbars>
      <div class="select-row-modal__search">
        <i v-if="!openForm" class="fas fa-search select-row-modal__search-icon"></i>
        <input
         v-if="!openForm"
          ref="search"
          v-model="visibleSearch"
          type="text"
          :placeholder="$t('selectRowContent.search')"
          class="input select-row-modal__search-input"
          @keypress.enter="doSearch(visibleSearch)"
        />
      </div>
      <div  class="select-row-modal__rows" 
      :style="openForm ? 'height: auto;padding: 10px 20px;background-color: #ffffff;':''">
        <div v-if="!openForm" class="select-row-modal__left">
          <div class="select-row-modal__head">
            <div
              class="select-row-modal__field select-row-modal__field--first"
            ></div>
            <div class="select-row-modal__field">
              <i
                class="fas select-row-modal__field-icon"
                :class="'fa-' + primary._.type.iconClass"
              ></i>
              {{ primary.name }}
            </div>
          </div>
          <div class="select-row-modal__body">
            <div
              v-for="row in rows"
              :key="'left-select-row-' + tableId + '-' + row.id"
              class="select-row-modal__row"
              :class="{
                'select-row-modal__row--hover': row._.hover,
                'select-row-modal__row--selected': isAlreadySelected(row.id),
              }"
              @mouseover="setRowHover(row, true)"
              @mouseleave="setRowHover(row, false)"
              @click="select(row, primary, fields)"
            >
              <div class="select-row-modal__cell select-row-modal__cell--first">
                {{ row.id }}
              </div>
              <div class="select-row-modal__cell">
                <SelectRowField :field="primary" :row="row"></SelectRowField>
              </div>
            </div>
          </div>
          <div class="select-row-modal__foot">
            <Paginator
              :total-pages="totalPages"
              :page="page"
              @change-page="fetch"
            ></Paginator>
          </div>
        </div>
        <div ref="right"
         :style="openForm ? 'position: revert;padding: 10px 20px;':''"
         class="select-row-modal__right">
          <div v-show="!openForm" class="select-row-modal__head">
            <div
              v-for="field in fields"
              :key="field.id"
              class="select-row-modal__field"
            >
              <i
                class="fas select-row-modal__field-icon"
                :class="'fa-' + field._.type.iconClass"
              ></i>
              {{ field.name }}
            </div>
          </div>
          <div v-show="!openForm" class="select-row-modal__body">
            <div
              v-for="row in rows"
              :key="'right-select-row-' + tableId + '-' + row.id"
              class="select-row-modal__row"
              :class="{
                'select-row-modal__row--hover': row._.hover,
                'select-row-modal__row--selected': isAlreadySelected(row.id),
              }"
              @mouseover="setRowHover(row, true)"
              @mouseleave="setRowHover(row, false)"
              @click="select(row, primary, fields)"
            >
              <div
                v-for="field in fields"
                :key="'select-row-' + row.id + '-field-' + field.id"
                class="select-row-modal__cell"
              >
                <SelectRowField :field="field" :row="row"></SelectRowField>
              </div>
            </div>
          </div>
          <div
            v-show="!openForm"
            class="select-row-modal__foot"
            :style="{
              width: 3 * 200 + 'px',
            }"
          >
          <button v-show="!openForm" type="button" @click="openForm = !openForm" class="addNewRow">
              Add New Row
          </button>
          </div>
          <button v-show="!openForm && openForm" type="button" @click="openForm = !openForm" class="addNewRow">
              Add New Row
          </button>
          <h4 class="titlePopup" v-if="openForm && table && table.name">{{table.name}}</h4>
           <RowEditModalFieldsListCreate
            v-if="openForm"
            :hidden="false"
            :sortable="false"
            :read-only="false"
            :row="row"
            :isLength="rows.length"
            :table="table"
            :fields="newFields"
            @update="update"
          >
          </RowEditModalFieldsListCreate> 
          <button v-show="openForm" type="button" @click="addNewRow" class="buttonSave button button--large">
              Save
          </button>
        </div>
      </div>
    </div> 
  </div>
</template>

<script>
import RowEditModalFieldsListCreate from './RowEditModalFieldsListCreate.vue'
import { notifyIf } from '@baserow/modules/core/utils/error'
import FieldService from '@baserow/modules/database/services/field'
import tableService from '@baserow/modules/database/services/table'
import { populateField } from '@baserow/modules/database/store/field'
import RowService from '@baserow/modules/database/services/row'
import { populateRow } from '@baserow/modules/database/store/view/grid'

import Paginator from '@baserow/modules/core/components/Paginator'
import SelectRowField from './SelectRowField'

export default {
  name: 'SelectRowContent',
  components: { Paginator, SelectRowField ,RowEditModalFieldsListCreate},
  props: {
    tableId: {
      type: Number,
      required: true,
    },
    value: {
      type: Array,
      required: false,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      openForm: false,
      loaded: false,
      primary: null,
      field: null,
      fields: [],
      newFields: [],
      rows: [],
      row: {},
      table: {},
      search: '',
      visibleSearch: '',
      page: 1,
      totalPages: null,
      values: null,
      lastHoveredRow: null,
    }
  },
  async mounted() {
    // The first time we have to fetch the fields because they are unknown for this
    // table.
    // console.log(this.fields);
    
    // 
    await this.fetchFields(this.tableId)

    // We want to start with some initial data when the modal opens for the first time.
    await this.fetch(1)
    // this.field = this.fields[0];
    // Becuase most of the template depends on having some initial data we mark the
    // state as loaded after that. Only a loading animation is shown if there isn't any
    // data.
    this.loaded = true

    // Focus the search field so the user may begin typing immediately.
    this.$nextTick(() => {
      this.focusSearch()
    })
    // this.row = this.rows[1];
  },
  methods: {
    update(event){
      this.values = event
    },
   async addNewRow(before = null, values = {}){
    this.openForm = false;
     values = this.values;
      let view = JSON.parse(localStorage.getItem('view'));
       try {
        await this.$store.dispatch('page/view/grid/createNewRow',
          {
            view: view,
            table: this.table,
            // We need a list of all fields including the primary one here.
            fields: this.fields,
            notInset: false,
            primary: this.primary,
            values,
            before,
          }
        )
        await this.fetch(1)
      } catch (error) {
        notifyIf(error, 'row')
      }
    },
    /**
     * Returns the scrollable element for the scrollbar.
     */
    getHorizontalScrollbarElement() {
      return this.$refs.right
    },
    /**
     * Event that is called when the users does any form of scrolling on the whole grid
     * surface.
     */
    scroll(pixelY, pixelX) {
      const left = this.$refs.right.scrollLeft + pixelX
      this.horizontalScroll(left)
      this.$refs.scrollbars.update()
    },
    horizontalScroll(left) {
      this.$refs.right.scrollLeft = left
    },
    /**
     * Returns true if the value already contains the given row id.
     */
    isAlreadySelected(rowId) {
      for (let i = 0; i < this.value.length; i++) {
        if (this.value[i].id === rowId) {
          return true
        }
      }
      return false
    },
    /**
     * Because the rows are split in a left and right section we need Javascript to
     * show a hover effect of the whole row. This method makes sure the correct row has
     * the correct hover state.
     */
    setRowHover(row, value) {
      if (this.lastHoveredRow !== null && this.lastHoveredRow.id !== row.id) {
        this.lastHoveredRow._.hover = false
      }

      row._.hover = value
      this.lastHoveredRow = row
    },
    /**
     * Fetches all the fields of the given table id. We need the fields so that we can
     * show the data in the correct format.
     */
    async fetchFields(tableId) {
      try {
        const table = await tableService(this.$client).get(tableId);
        // console.log(total);
        this.table = table.data
        const { data } = await FieldService(this.$client).fetchAll(tableId);
        data.forEach((part, index, d) => {
          populateField(data[index], this.$registry)
        })
        const primaryIndex = data.findIndex((item) => item.primary === true)
        // console.log('primaryIndex',primaryIndex);
        // console.log('data',data);
        this.primary = primaryIndex !== -1 ? data.splice(primaryIndex, 1)[0] : null
        this.fields = data;
        this.newFields = [...data];
        this.newFields.unshift(this.primary);
      } catch (error) {
        this.loading = false
        notifyIf(error, 'row')
      }
    },
    /**
     * Does a row search in the table related to the state. It will also reset the
     * pagination.
     */
    async doSearch(query) {
      this.search = query
      this.totalPages = null
      await this.fetch(1)
    },
    /**
     * Fetches the rows of a given page and adds them to the state. If a search query
     * has been stored in the state then that will be remembered.
     */
    async fetch(page) {
      this.loading = true

      try {
        const { data } = await RowService(this.$client).fetchAll({
          tableId: this.tableId,
          page,
          size: 10,
          search: this.search,
        })
        data.results.forEach((part, index) => populateRow(data.results[index]))

        this.page = page
        this.totalPages = Math.ceil(data.count / 10)
        this.rows = data.results
        this.row = data.results[0]
      } catch (error) {
        notifyIf(error, 'row')
      }

      this.loading = false
    },
    /**
     * Called when the user selects a row.
     */
    select(row, primary, fields) {
      if (this.isAlreadySelected(row.id)) {
        return
      }

      console.log(row)
      this.$emit('selected', { row, primary, fields })
    },
    /**
     * Focuses the search field when the component mounts.
     */
    focusSearch() {
      this.$refs.search?.focus()
    },
  },
}
</script>
<style scoped>
.addNewRow {
    background: none;
    border: none;
    font-size: 14px;
    display: inline-block;
    position: sticky;
    left: 0;
    font-weight: bold;
    color: #198dd6;
    /* margin-top: -5px; */
    cursor: pointer;
    text-decoration: underline;
    padding: 0px 12px;
    text-align: right;
}
.buttonSave {
    max-width: 40%;
    margin-left: auto;
}
.titlePopup{
    padding: 0 0 8px 0;
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: bold;
    border-bottom: 2px solid #333;
    max-width: 24%;
    color: #188dd6;
}
</style>
