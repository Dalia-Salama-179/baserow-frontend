<!-- edited By Ahmed Elsayed -->
<template>
  <RecursiveWrapper
    :components="
      wrapperDecorations.map((comp) => ({
        ...comp,
        props: comp.propsFn(row),
      }))
    "
  >
  
  <!-- 'grid-view__row--warning':
          !row._.matchFilters || !row._.matchSortings || !row._.matchSearch, -->
    <div
      class="grid-view__row"
      :class="{
        'grid-view__row--selected': row._.selectedBy.length > 0,
        'grid-view__row--loading': row._.loading,
        'grid-view__row--hover': row._.hover,
        'grid-view__row--warning':
          !row._.matchFilters || !row._.matchSearch || 
          row._.duplicated || row['field_363'],
      }"
      @mouseover="$emit('row-hover', { row, value: true })"
      @mouseleave="$emit('row-hover', { row, value: false })"
      @contextmenu.prevent="$emit('row-context', { row, event: $event })"
    >
    <!-- !row._.matchFilters || !row._.matchSortings || !row._.matchSearch -->
      <template v-if="includeRowDetails">
        <div
          v-if="
            !row._.matchFilters || !row._.matchSearch || 
            row._.duplicated || row['field_363']
          "
          class="grid-view__row-warning"
        >
          <template v-if="!row._.matchFilters">
            {{ $t('gridViewRow.rowNotMatchingFilters') }}
          </template>
          <template v-else-if="!row._.matchSearch">
            {{ $t('gridViewRow.rowNotMatchingSearch') }}
          </template>
           <template v-else-if="row._.duplicated || row['field_363']">{{
            $t('gridViewRow.rowHasDuplicated')
          }}</template>
          <!-- <template v-else-if="!row._.matchSortings">{{
            $t('gridViewRow.rowHasMoved')
          }}</template> -->
        </div>
        <!-- {{row}}dd -->
        <div
          class="grid-view__column"
          :style="{ width: gridViewRowDetailsWidth + 'px' }"
        >
          <div
            class="grid-view__row-info"
            :class="{
              'grid-view__row-info--matches-search':
                row._.matchSearch &&
                row._.fieldSearchMatches.includes('row_id'),
            }"
          >
            <div
              class="grid-view__row-count"
              :class="{ 'grid-view__row-count--small': rowIdentifier > 9999 }"
              :title="rowIdentifier"
            >
              {{ rowIdentifier }}
            </div>
            <div
              v-if="!readOnly && canDrag"
              class="grid-view__row-drag"
              @mousedown="startDragging($event, row)"
            ></div>
            <component
              :is="rowExpandButton"
              :row="row"
              @edit-modal="$emit('edit-modal', row)"
            ></component>
            <!-- v-show="row._.hover" -->
            <button v-if="table.name == 'organizations'" @click="getCrunchBase(row)" title="Get crunch base" class="button button--primary buttonNew" v-show="row._.hover">
              CB
            </button>
            <button v-if="table.name == 'Founders'" @click="getCrunchFounders(row)" title="Get crunch base" class="button button--primary buttonNew" v-show="row._.hover">
              CB
            </button>
            <component
              :is="dec.component"
              v-for="dec in firstCellDecorations"
              :key="dec.decoration.id"
              v-bind="dec.propsFn(row)"
            />
          </div>
        </div>
      </template>
      <!--
      Somehow re-declaring all the events instead of using v-on="$listeners" speeds
      everything up because the rows don't need to be updated everytime a new one is
      rendered, which happens a lot when scrolling.
      -->
      <!-- {{fieldsToRender}} -->
      <GridViewCell
        v-for="field in fieldsToRender"
        :table="table"
        :key="'row-field-' + row.id.toString() + '-' + field.id.toString()"
        :field="field"
        :row="row"
        :state="state"
        :multi-select-position="getMultiSelectPosition(row.id, field)"
        :read-only="readOnly"
        :store-prefix="storePrefix"
        :style="{
          width: fieldWidths[field.id] + 'px',
          ...getSelectedCellStyle(field),
        }"
        @update="$emit('update', $event)"
        @paste="$emit('paste', $event)"
        @edit="$emit('edit', $event)"
        @select="$emit('select', $event)"
        @unselect="$emit('unselect', $event)"
        @selected="$emit('selected', $event)"
        @unselected="$emit('unselected', $event)"
        @select-next="$emit('select-next', $event)"
        @cell-mousedown-left="$emit('cell-mousedown-left', { row, field })"
        @cell-mouseover="$emit('cell-mouseover', { row, field })"
        @cell-mouseup-left="$emit('cell-mouseup-left', { row, field })"
      ></GridViewCell>
    </div>
  </RecursiveWrapper>
</template>

<script>
import GridViewCell from '@baserow/modules/database/components/view/grid/GridViewCell'
import gridViewHelpers from '@baserow/modules/database/mixins/gridViewHelpers'
import GridViewRowExpandButton from '@baserow/modules/database/components/view/grid/GridViewRowExpandButton'
import RecursiveWrapper from '@baserow/modules/database/components/RecursiveWrapper'
import RowService from '@baserow/modules/database/services/row'

export default {
  name: 'GridViewRow',
  components: { GridViewRowExpandButton, GridViewCell, RecursiveWrapper },
  mixins: [gridViewHelpers],
  props: {
    table: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
    decorationsByPlace: {
      type: Object,
      required: true,
    },
    allFields: {
      type: Array,
      required: true,
    },
    fieldWidths: {
      type: Object,
      required: true,
    },
    includeRowDetails: {
      type: Boolean,
      required: false,
      default: () => false,
    },
    readOnly: {
      type: Boolean,
      required: true,
    },
    canDrag: {
      type: Boolean,
      required: true,
    },
    rowIdentifierType: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      // The state can be used by functional components to make changes to the dom.
      // This is for example used by the functional file field component to enable the
      // drop effect without having the cell selected.
      state: {},
      // A list containing field id's of field cells that must not be converted to the
      // functional component even though the user has selected another cell. This is
      // for example used by the file field to finish the uploading task if the user
      // has selected another cell while uploading.
      alive: [],
      rowExpandButton: this.$registry
        .get('application', 'database')
        .getRowExpandButtonComponent(),
    }
  },
  computed: {
    /**
     * This component already accepts a `fields` property containing the fields that
     * must be rendered based on the viewport width and horizontal scroll offset,
     * meaning it only renders the fields that are in the viewport. Because a selected
     * field must always be rendered, this computed property checks if there is a
     * selected field and if so, it's added to the array. This doesn't influence the
     * position of the other cells because the position will be absolute. The selected
     * field must always be rendered, otherwise the arrow keys and other functionality
     * won't work.
     */
    fieldsToRender() {
      // If the row doesn't have a selected field, we can safely return the fields
      // because we just want to render the fields inside of the view port.
      if (!this.row._.selected) {
        return this.fields
      }

      // Check if the selected field exists in the all fields array, so not just the to
      // be rendered ones.
      const selectedField = this.allFields.find(
        (field) => field.id === this.row._.selectedFieldId
      )

      // If it doesn't exist or if it's already in the fields array, we don't have to
      // add it because it's already rendered.
      if (
        selectedField === undefined ||
        this.fields.find((field) => field.id === selectedField.id) !== undefined
      ) {
        return this.fields
      }

      // If the selected field exists in all fields, but not in fields it must be added
      // to the fields array because we want to render it. It won't influence the other
      // cells because it's positioned absolute.
      const fields = this.fields.slice()
      fields.unshift(selectedField)
      return fields
    },
    firstCellDecorations() {
      return this.decorationsByPlace?.first_cell || []
    },
    wrapperDecorations() {
      return this.decorationsByPlace?.wrapper || []
    },
    rowIdentifier() {
      switch (this.rowIdentifierType) {
        case 'count':
          return this.count
        default:
          return this.row.id
      }
    },
  },
  methods: {
    getCrunchBase(row){
        // console.log('ROW',row);
        // console.log('row[field_357]',row['field_357']);
        // console.log('row[field_604]',row['field_604']);
        const { data } = RowService(this.$client).fetchAll({
          tableId: this.table.id,
          search: row['field_357'],
        }).then( (response) => {
          // console.log('response response',response);
          if (response.data.results.length) {
          let newArray = [...response.data.results]
          let bigCities = newArray.filter(function (e) {
            // console.log('row[field_604]',e['field_604'] == row['field_604']);
            // console.log('row[field_357]',e['field_357'] == row['field_357']);
            // console.log('e.id && row.id',e.id != row.id);
            return e['field_604'] == row['field_604'] && e['field_357'] == row['field_357'] && e.id != row.id;
          });
          // console.log(bigCities);
          if (bigCities.length) {
            // console.log(bigCities);
            let values = {};
            values['field_363'] = true
            // row['field_363'] = true
            RowService(this.$client).update(
                this.table.id,
                row.id,
                values
              ).then( (response) => {
                  // console.log('response',response);
                  let refresh = JSON.parse(localStorage.getItem('refresh'));
                  this.$store.dispatch(this.storePrefix + 'view/grid/refresh', refresh);
              }) 
            }
          }
        }).catch(( error ) => {
          console.log('error error',error);
        })
        this.$client.post(
          `t2/crunch_base_organization/${this.table.id}/${row.id}/`,
          { 
            cb_url_field_name:'field_604',
            cb_uuid_field_name:'field_367',
            company_prev_raised_count_field_name:'field_654',
            company_total_raised_value_field_name:'field_655',
            cb_updated_at:'field_656',
          }
        ).then( (response) => {
          // console.log('response',response);
          let refresh = JSON.parse(localStorage.getItem('refresh'));
          this.$store.dispatch(this.storePrefix + 'view/grid/refresh', refresh);
        }).catch(( error ) => {
            // console.log('error',error);
            let refresh = JSON.parse(localStorage.getItem('refresh'));
            this.$store.dispatch(this.storePrefix + 'view/grid/refresh', refresh)
       })
    },
    getCrunchFounders(row){
        this.$client.post(
          `t2/crunch_base_founder/${this.table.id}/${row.id}/`,
          { 
            cb_url_field_name:'field_320',
            cb_uuid_field_name:'field_363',
            company_prev_raised_count_field_name:'field_657',
            company_total_raised_value_field_name:'field_658',
            cb_updated_at:'field_656',
            organization_of_interest_field_name:'field_487',
            org_founder_map_founding_date_field_name:'field_476',
          }
        ).then( (response) => {
          // console.log('response',response);
          let refresh = JSON.parse(localStorage.getItem('refresh'));
          this.$store.dispatch(this.storePrefix + 'view/grid/refresh', refresh);
        }).catch(( error ) => {
            // console.log('error',error);
            let refresh = JSON.parse(localStorage.getItem('refresh'));
            this.$store.dispatch(this.storePrefix + 'view/grid/refresh', refresh)
       })
    },
    isCellSelected(fieldId) {
      return this.row._.selected && this.row._.selectedFieldId === fieldId
    },
    selectCell(fieldId, rowId = this.row.id) {
      this.$store.dispatch(this.storePrefix + 'view/grid/setSelectedCell', {
        rowId,
        fieldId,
      })
    },
    // Return an object that represents if a cell is selected,
    // and it's current position in the selection grid
    getMultiSelectPosition(rowId, field) {
      const position = {
        selected: false,
        top: false,
        right: false,
        bottom: false,
        left: false,
      }
      if (
        this.$store.getters[this.storePrefix + 'view/grid/isMultiSelectActive']
      ) {
        const rowIndex =
          this.$store.getters[this.storePrefix + 'view/grid/getRowIndexById'](
            rowId
          )

        const allFieldIds = this.allFields.map((field) => field.id)
        let fieldIndex = allFieldIds.findIndex((id) => field.id === id)
        fieldIndex += !field.primary ? 1 : 0

        const [minRow, maxRow] =
          this.$store.getters[
            this.storePrefix + 'view/grid/getMultiSelectRowIndexSorted'
          ]
        const [minField, maxField] =
          this.$store.getters[
            this.storePrefix + 'view/grid/getMultiSelectFieldIndexSorted'
          ]

        if (rowIndex >= minRow && rowIndex <= maxRow) {
          if (fieldIndex >= minField && fieldIndex <= maxField) {
            position.selected = true
            if (rowIndex === minRow) {
              position.top = true
            }
            if (rowIndex === maxRow) {
              position.bottom = true
            }
            if (fieldIndex === minField) {
              position.left = true
            }
            if (fieldIndex === maxField) {
              position.right = true
            }
          }
        }
      }
      return position
    },
    setState(value) {
      this.state = value
    },
    addKeepAlive(fieldId) {
      if (!this.alive.includes(fieldId)) {
        this.alive.push(fieldId)
      }
    },
    removeKeepAlive(fieldId) {
      const index = this.alive.findIndex((id) => id === fieldId)
      if (index > -1) {
        this.alive.splice(index, 1)
      }
    },
    startDragging(event, row) {
      if (this.readOnly) {
        return
      }

      event.preventDefault()
      this.$emit('row-dragging', { row, event })
    },
    /**
     * Returns an object with additional styling if the field is selected and outside
     * of the viewport. This is because selected fields must always be rendered because
     * otherwise certain functionality won't work.
     */
    getSelectedCellStyle(field) {
      const exists = this.fields.find((f) => f.id === field.id) !== undefined

      // If the field already exists in the field list it means that it's already
      // rendered. In that case we don't have to provide any other styling because it's
      // already in the position it's supposed to be in.
      if (exists) {
        return {}
      }

      // If the field doesn't exist in the fields array, it's being rendered because
      // it's selected. In that case, the element must be positioned without influencing
      // the other cells.
      const styling = { position: 'absolute' }

      const selectedFieldIndex = this.allFields.findIndex(
        (field) => field.id === this.row._.selectedFieldId
      )
      const firstVisibleFieldIndex = this.allFields.findIndex(
        (field) => field.id === this.fields[0].id
      )
      const lastVisibleFieldIndex = this.allFields.findIndex(
        (field) => field.id === this.fields[this.fields.length - 1].id
      )

      // Positions the selected field cell on the right position without influencing the
      // position of the rendered cells. This is needed because other components depend
      // on the cell to be in the right position, for example when using the arrow key
      // navigation.
      if (selectedFieldIndex < firstVisibleFieldIndex) {
        // If the selected field must be positioned before the other fields
        let spaceBetween = 0
        for (let i = selectedFieldIndex; i < firstVisibleFieldIndex; i++) {
          spaceBetween += this.fieldWidths[this.allFields[i].id]
        }
        styling.left = -spaceBetween + 'px'
      } else if (selectedFieldIndex > lastVisibleFieldIndex) {
        // If the selected field must be positioned after the other fields.
        let spaceBetween = 0
        for (let i = lastVisibleFieldIndex; i < selectedFieldIndex; i++) {
          spaceBetween += this.fieldWidths[this.allFields[i].id]
        }
        styling.right = -spaceBetween + 'px'
      }

      return styling
    },
  },
}
</script>
<style scoped>
.buttonNew{
    padding: 0 6px;
    height: 22px;
    line-height: 12px;
    font-size: 12px;
}
</style>