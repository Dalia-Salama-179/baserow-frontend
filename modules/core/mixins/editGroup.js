import { notifyIf } from '@baserow/modules/core/utils/error'
import { string } from 'yargs'

/**
 * Some helper method to modify groups used by the sidebar and dashboard.
 */
export default {
  props: {
    type: {
      type: String,
      default: 'group'
    },
  },
  methods: {
    setLoading(group, value) {
      this.$store.dispatch(`${this.$props.type}/setItemLoading`, { group, value })
    },
    enableRename() {
      this.$refs.context.hide()
      this.$refs.rename.edit()
    },
    async renameGroup(group, event, users) {
      this.setLoading(group, true)
      console.log(users);
      try {
        if (users) {
          await this.$store.dispatch(`${users}/update`, {
            group,
            values: {
              username: event.value,
              first_name: group.first_name,
              password: group.password,
            },
          })
        } else {
          await this.$store.dispatch(`${this.$props.type}/update`, {
            group,
            values: {
              name: event.value,
            },
          })
        }

      } catch (error) {
        this.$refs.rename.set(event.oldValue)
        notifyIf(error, 'group')
      }

      this.setLoading(group, false)
    },
    selectGroup(group) {
      this.$store.dispatch(`${this.$props.type}/select`, group)
      this.$emit('selected')
    },
  },
}
