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
  import { number } from 'yargs'

  export default {
    name: 'RowEditModalFieldsList',
    components: {
      RowEditModalFieldCreate
    },
    data() {
      return {
        item: {},
        items: []
      }
    },
    props: {
      primaryIsSortable: {
        type: Boolean,
        required: false,
        default: false
      },
      fields: {
        type: Array,
        required: true
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
        required: true
      },
      table: {
        required: false
      },
      primary: {
        type: Object
      }
    },
    methods: {
      update(event) {
        console.log(event)
        this.items = []
        this.items.push(this.item)
        this.item[`field_${event.field.id}`] = event.value

        const {field, value} = event

        if (this.table.name === 'person' &&
                (field.name === 'first_name' || field.name === 'twitter_handle' || field.name === 'last_name')
        ) {
          this.item[`field_${this.primary.id}`] = `${this.item['field_418']? this.item['field_418']+'_': ''}${this.item['field_419']? this.item['field_419'] + '*': ''}${this.item['field_422']? this.item['field_422']: ''}`
        }

        this.$emit('update', this.item)
      },
      fieldIsSortable(field) {
        return this.sortable && (this.primaryIsSortable || !field.primary)
      }
    }
  }
</script>
