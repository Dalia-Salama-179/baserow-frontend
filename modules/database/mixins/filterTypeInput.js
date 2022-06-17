import viewFilter from '@baserow/modules/database/mixins/viewFilter'

let delayTimeout = null

/**
 * Mixin that introduces a delayedUpdate helper method. This method is specifically
 * helpful in combination with an input field that accepts any form of text. When the
 * user stops typing for 400ms it will do the actual update, but only if the validation
 * passes.
 */
export default {
  mixins: [viewFilter],
  data() {
    return {
      copy: null,
    }
  },
  watch: {
    'filter.value'(value) {
      this.copy = value
      clearTimeout(delayTimeout)
    },
  },
  created() {
    this.copy = this.filter.value
    if (this.copy) {
      this.$v.$touch()
    }
  },
  methods: {
    delayedUpdate(value, immediately = false) {
      if (this.disabled) {
        return
      }

      clearTimeout(delayTimeout)
      this.$v.$touch()

      if (this.$v.copy.$error) {
        return
      }

      if (immediately) {
        this.$emit('input', value)
      } else {
        delayTimeout = setTimeout(() => {
          this.$emit('input', value)
        }, 400)
      }
    },
  },
  validations: {
    copy: {},
  },
}
