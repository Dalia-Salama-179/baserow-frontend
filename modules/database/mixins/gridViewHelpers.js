import { mapGetters } from 'vuex'

export default {
  props: {
    storePrefix: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      gridViewRowDetailsWidth: 70,
    }
  },
  beforeCreate() {
    this.$options.computed = {
      ...(this.$options.computed || {}),
      ...mapGetters({
        fieldOptions:
          this.$options.propsData.storePrefix + 'view/grid/getAllFieldOptions',
        publicGrid: this.$options.propsData.storePrefix + 'view/grid/isPublic',
      }),
    }
  },
  methods: {
    getFieldWidth(fieldId) {
      const hasFieldOptions = Object.prototype.hasOwnProperty.call(
        this.fieldOptions,
        fieldId
      )

      if (hasFieldOptions && this.fieldOptions[fieldId].hidden) {
        return 0
      }

      return hasFieldOptions ? this.fieldOptions[fieldId].width : 200
    },
    getFieldByName(name, isPrimary = false, fields = null) {
      if (typeof window !== 'undefined') {
        if (fields) {
          const field = fields.find((x) => x.name === name)
          return `field_${field?.id}`
        } else {
          const refresh = JSON.parse(localStorage.getItem('refresh'))
          if (refresh) {
            if (isPrimary) {
              return `field_${refresh.primary.id}`
            } else {
              const field = refresh.fields.find((x) => x.name === name)
              return `field_${field?.id}`
            }
          }
        }
      }
    },
  },
}
