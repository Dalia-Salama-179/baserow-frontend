import { mapGetters } from 'vuex'
import { notifyIf } from '@baserow/modules/core/utils/error'
import { clone } from '@baserow/modules/core/utils/object'

export default {
  props: {
    storePrefix: {
      type: String,
      required: true,
    },
  },
  methods: {
    async updateForm(values) {
      const view = this.view
      this.$store.dispatch('view/setItemLoading', { view, value: true })

      try {
        await this.$store.dispatch('view/update', {
          view,
          values,
        })
      } catch (error) {
        notifyIf(error, 'view')
      }

      this.$store.dispatch('view/setItemLoading', { view, value: false })
    },
    async updateFieldOptionsOfField(form, field, values) {
      try {
        await this.$store.dispatch(
          this.storePrefix + 'view/form/updateFieldOptionsOfField',
          {
            form,
            field,
            values,
          }
        )
      } catch (error) {
        notifyIf(error, 'view')
      }
    },
    async updateFieldOptionsOfFields(
      form,
      fields,
      values,
      onlyCompatible = false
    ) {
      const oldFieldOptions = clone(this.fieldOptions)
      const newFieldOptions = {}
      fields
        .filter((field) => {
          if (!onlyCompatible) {
            return true
          }
          const fieldType = this.$registry.get('field', field.type)
          return fieldType.getFormViewFieldComponent() !== null
        })
        .forEach((field) => {
          newFieldOptions[field.id] = values
        })

      try {
        await this.$store.dispatch(
          this.storePrefix + 'view/form/updateAllFieldOptions',
          {
            form,
            newFieldOptions,
            oldFieldOptions,
          }
        )
      } catch (error) {
        notifyIf(error, 'view')
      }
    },
  },
  beforeCreate() {
    this.$options.computed = {
      ...(this.$options.computed || {}),
      ...mapGetters({
        fieldOptions:
          this.$options.propsData.storePrefix + 'view/form/getAllFieldOptions',
      }),
    }
  },
}
