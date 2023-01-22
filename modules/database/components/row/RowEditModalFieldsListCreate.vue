<!-- edited By Ahmed Elsayed -->
<template>
  <ul class="row-modal__field-list margin-bottom-0">
    <li
      v-for="field in fields"
      :key="'row-edit-field-' + field.id"
      class="row-modal__field-item"
    >
      <RowEditModalFieldCreate
        :ref="'field-' + field.id"
        :field="field"
        :read-only="false"
        :row="item"
        :value="items"
        :table="table"
        @field-updated="$emit('field-updated', $event)"
        @field-deleted="$emit('field-deleted')"
        @update="update"
      ></RowEditModalFieldCreate>
    </li>
  </ul>
</template>

<script>
import RowEditModalFieldCreate from '@baserow/modules/database/components/row/RowEditModalFieldCreate'
import gridViewHelpers from '@baserow/modules/database/mixins/gridViewHelpers'

export default {
  name: 'RowEditModalFieldsList',
  components: {
    RowEditModalFieldCreate,
  },
  mixins: [gridViewHelpers],
  props: {
    primaryIsSortable: {
      type: Boolean,
      required: false,
      default: false,
    },
    fields: {
      type: Array,
      required: true,
    },
    // sortable: {
    //   type: Boolean,
    //   required: true,
    // },
    // hidden: {
    //   type: Boolean,
    //   required: true,
    // },
    // readOnly: {
    //   type: Boolean,
    //   required: true,
    // },
    isLength: {
      type: Number,
      required: true,
    },
    table: {
      required: false,
    },
    primary: {
      type: Object,
    },
  },
  data() {
    return {
      item: {},
      items: [],
    }
  },
  methods: {
    update(event) {
      this.items = []
      this.items.push(this.item)
      this.item[`field_${event.field.id}`] = event.value

      const { field, value } = event
      const firstName = this.getFieldByName('first_name')
      const lastName = this.getFieldByName('last_name')
      const twitterHandle = this.getFieldByName('twitter_handle')

      if (
        (this.table.name === 'person' ||
          this.table.name === 'Person_POC' ||
          this.table.name === 'Person_R2') &&
        (field.name === 'first_name' ||
          field.name === 'twitter_handle' ||
          field.name === 'last_name')
      ) {
        this.item[`field_${this.primary.id}`] = `${
          this.item[firstName] ? this.item[firstName] + '_' : ''
        }${this.item[lastName] ? this.item[lastName] + '*' : ''}${
          this.item[twitterHandle] ? this.item[twitterHandle] : ''
        }`
      }

      this.$emit('update', this.item)
    },
    fieldIsSortable(field) {
      return this.sortable && (this.primaryIsSortable || !field.primary)
    },
  },
}
</script>
