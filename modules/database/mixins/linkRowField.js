//  edited By Ahmed Elsayed 
export default {
  methods: {
    /**
     * Removes an existing relation from the value.
     */
    removeValue(event, value, id) {
      const val = JSON.parse(JSON.stringify(value))
      const index = val.findIndex((item) => item.id === id)
      if (index === -1) {
        return
      }

      val.splice(index, 1)

      let newValue = []
      if (val.length > 0) {
        val.map(el => {
          newValue.push(el.id)
        })
      }

      this.$emit('update', newValue, value)
    },
    /**
     * Adds a new relation to the value. This typically happens via the modal.
     */
    addValue(value, { row, primary }) {
      // Check if the relation already exists.
      // console.log('ddddddddddddddddddddddddddddddddddddd');
      for (let i = 0; i < value.length; i++) {
        if (value[i].id === row.id) {
          return
        }
      }

      // Prepare the new value with all the relations and emit that value to the
      // parent.
      // const newValue = JSON.parse(JSON.stringify(value))
      const val = JSON.parse(JSON.stringify(value))
      let newValue = []
      if (val.length > 0) {
        val.map(el => {
          newValue.push(el.id)
        })
      }

      const rowValue = this.$registry
        .get('field', primary.type)
        .toHumanReadableString(primary, row[`field_${primary.id}`]);
      // console.log(newValue);
      // console.log(rowValue);
      /*newValue.push({
        id: row.id,
        value: rowValue,
      })*/
      newValue.push(row.id)
      this.$emit('update', newValue, value)
    },
  },
}
