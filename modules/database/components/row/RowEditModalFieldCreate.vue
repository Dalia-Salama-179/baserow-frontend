<template>
  <div v-if="field.type != 'link_row'" class="control">
    <label class="control__label">
      <a
        :class="{ 'row-modal__field-item-handle': sortable }"
        data-field-handle
      ></a>
      <i
        class="fas control__label-icon"
        :class="'fa-' + field._.type.iconClass"
      ></i>
      {{ field.name }}
      <a
        v-if="!readOnly"
        ref="contextLink"
        class="control__context"
        @click="$refs.context.toggle($refs.contextLink, 'bottom', 'left', 0)"
      >
        <i class="fas fa-caret-down"></i>
      </a>
    </label>
    <FieldContext
      ref="context"
      :table="table"
      :field="field"
      @update="$emit('field-updated', $event)"
      @delete="$emit('field-deleted')"
    >
      <li v-if="canBeHidden">
        <a @click="$emit('toggle-field-visibility', { field })">
          <i
            class="context__menu-icon fas fa-fw"
            :class="[hidden ? 'fa-eye' : 'fa-eye-slash']"
          ></i>
          {{ $t(hidden ? 'fieldContext.showField' : 'fieldContext.hideField') }}
        </a>
      </li>
    </FieldContext>
    <component
      :is="getFieldComponent(field.type)"
      ref="field"
      :field="field"
      :value="value && value[0] && value[`field_${field.id}`] != 'undefined' ? value[0][`field_${field.id}`] : field.type != 'boolean'? field.name == 'aingel_id' ? uuid : [] : '' "
      :read-only="readOnly"
      @update="update"
    />
  </div>
</template>

<script>
import FieldContext from '@baserow/modules/database/components/field/FieldContext'
import { uuid } from '@baserow/modules/core/utils/string'
export default {
  name: 'RowEditModalField',
  components: { FieldContext },
  data() {
    return {
      uuid: uuid()
    }
  },
  props: {
    table: {
      type: Object,
      required: true,
    },
    field: {
      type: Object,
      required: true,
    },
    sortable: {
      type: Boolean,
      default: false,
    },
    canBeHidden: {
      type: Boolean,
      required: false,
      default: true,
    },
    hidden: {
      type: Boolean,
      required: false,
      default: false,
    },
    row: {
      type: Object,
      required: true,
    },
    value: {
      type: Array,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: true,
    },
  },
  mounted() {
    
    // this.$watch("$props.userName", (value) => {
    //   this.name = value;
    // });
  },
  watch: {
    value: {
        handler: function(newValue) {
          // console.log('dddddddddddddd',newValue);
          return newValue[0] 
          // if(newValue){
          //   this.value = newValue[0]
          //   console.log("this.newValue:" , this.value)
          // }
        },
        deep: true
    }
    // (value,newValue) {
    //   console.log('dddddddddddddd',value);
    //   console.log('dddddddddddddd',newValue);
    //   this.set(value)
    // },
  },
  methods: {
    getFieldComponent(type) {
      // console.log(type);
      return this.$registry.get('field', type).getRowEditFieldComponent()
    },
    update(value, oldValue) {
      // this
      // console.log(value);
      // console.log(this.field);
      // console.log(oldValue);
      this.$emit('update', {
        row: this.row,
        field: this.field,
        value,
        oldValue,
      })
    },
  },
}
</script>
