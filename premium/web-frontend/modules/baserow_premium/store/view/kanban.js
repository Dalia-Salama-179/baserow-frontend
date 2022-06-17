import Vue from 'vue'
import _ from 'lodash'
import { clone } from '@baserow/modules/core/utils/object'
import ViewService from '@baserow/modules/database/services/view'
import KanbanService from '@baserow_premium/services/views/kanban'
import {
  getRowSortFunction,
  matchSearchFilters,
} from '@baserow/modules/database/utils/view'
import RowService from '@baserow/modules/database/services/row'
import FieldService from '@baserow/modules/database/services/field'
import { SingleSelectFieldType } from '@baserow/modules/database/fieldTypes'

export function populateRow(row) {
  row._ = {
    dragging: false,
  }
  return row
}

export function populateStack(stack) {
  Object.assign(stack, {
    loading: false,
  })
  stack.results.forEach((row) => {
    populateRow(row)
  })
  return stack
}

export const state = () => ({
  lastKanbanId: -1,
  singleSelectFieldId: -1,
  stacks: {},
  fieldOptions: {},
  bufferRequestSize: 24,
  draggingRow: null,
  draggingOriginalStackId: null,
  draggingOriginalBefore: null,
})

export const mutations = {
  RESET(state) {
    state.lastKanbanId = -1
    state.singleSelectFieldId = -1
    state.stacks = {}
    state.fieldOptions = {}
  },
  SET_LAST_KANBAN_ID(state, kanbanId) {
    state.lastKanbanId = kanbanId
  },
  SET_SINGLE_SELECT_FIELD_ID(state, singleSelectFieldId) {
    state.singleSelectFieldId = singleSelectFieldId
  },
  REPLACE_ALL_STACKS(state, stacks) {
    state.stacks = stacks
  },
  ADD_ROWS_TO_STACK(state, { selectOptionId, count, rows }) {
    if (count) {
      state.stacks[selectOptionId].count = count
    }
    state.stacks[selectOptionId].results.push(...rows)
  },
  REPLACE_ALL_FIELD_OPTIONS(state, fieldOptions) {
    state.fieldOptions = fieldOptions
  },
  UPDATE_ALL_FIELD_OPTIONS(state, fieldOptions) {
    state.fieldOptions = _.merge({}, state.fieldOptions, fieldOptions)
  },
  UPDATE_FIELD_OPTIONS_OF_FIELD(state, { fieldId, values }) {
    if (Object.prototype.hasOwnProperty.call(state.fieldOptions, fieldId)) {
      Object.assign(state.fieldOptions[fieldId], values)
    } else {
      state.fieldOptions = Object.assign({}, state.fieldOptions, {
        [fieldId]: values,
      })
    }
  },
  DELETE_FIELD_OPTIONS(state, fieldId) {
    if (Object.prototype.hasOwnProperty.call(state.fieldOptions, fieldId)) {
      delete state.fieldOptions[fieldId]
    }
  },
  ADD_STACK(state, { id, stack }) {
    Vue.set(state.stacks, id.toString(), stack)
  },
  START_ROW_DRAG(state, { row, currentStackId, currentBefore }) {
    row._.dragging = true
    state.draggingRow = row
    state.draggingOriginalStackId = currentStackId
    state.draggingOriginalBefore = currentBefore
  },
  STOP_ROW_DRAG(state, { row }) {
    row._.dragging = false
    state.draggingRow = null
    state.draggingOriginalStackId = null
    state.draggingOriginalBefore = null
  },
  CREATE_ROW(state, { row, stackId, index }) {
    state.stacks[stackId].results.splice(index, 0, row)
  },
  DELETE_ROW(state, { stackId, index }) {
    state.stacks[stackId].results.splice(index, 1)
  },
  INCREASE_COUNT(state, { stackId }) {
    state.stacks[stackId].count++
  },
  DECREASE_COUNT(state, { stackId }) {
    state.stacks[stackId].count--
  },
  UPDATE_ROW(state, { row, values }) {
    Object.keys(state.stacks).forEach((stack) => {
      const rows = state.stacks[stack].results
      const index = rows.findIndex((item) => item.id === row.id)
      if (index !== -1) {
        const existingRowState = rows[index]
        Object.assign(existingRowState, values)
      }
    })
  },
  UPDATE_VALUE_OF_ALL_ROWS_IN_STACK(state, { fieldId, stackId, values }) {
    const name = `field_${fieldId}`
    state.stacks[stackId].results.forEach((row) => {
      Object.assign(row[name], values)
    })
  },
  MOVE_ROW(
    state,
    { currentStackId, currentIndex, targetStackId, targetIndex }
  ) {
    state.stacks[targetStackId].results.splice(
      targetIndex,
      0,
      state.stacks[currentStackId].results.splice(currentIndex, 1)[0]
    )
  },
  ADD_FIELD_TO_ALL_ROWS(state, { field, value }) {
    const name = `field_${field.id}`
    Object.keys(state.stacks).forEach((stack) => {
      // We have to replace all the rows by using the map function to make it
      // reactive and update immediately. If we don't do this, the value in the
      // field components of the grid and modal don't always have the correct value
      // binding.
      state.stacks[stack].results = state.stacks[stack].results.map((row) => {
        if (row !== null && !Object.prototype.hasOwnProperty.call(row, name)) {
          row[`field_${field.id}`] = value
          return { ...row }
        }
        return row
      })
    })
  },
}

export const actions = {
  /**
   * This method is typically called when the kanban view loads, but when it doesn't
   * yet have a single select option field. This will make sure that the old state
   * of another kanban view will be reset.
   */
  reset({ commit }) {
    commit('RESET')
  },
  /**
   * Fetches an initial set of rows and adds that data to the store.
   */
  async fetchInitial(
    { dispatch, commit, getters },
    { kanbanId, singleSelectFieldId, includeFieldOptions = true }
  ) {
    const { data } = await KanbanService(this.$client).fetchRows({
      kanbanId,
      limit: getters.getBufferRequestSize,
      offset: 0,
      includeFieldOptions,
      selectOptions: [],
    })
    Object.keys(data.rows).forEach((key) => {
      populateStack(data.rows[key])
    })
    commit('SET_LAST_KANBAN_ID', kanbanId)
    commit('SET_SINGLE_SELECT_FIELD_ID', singleSelectFieldId)
    commit('REPLACE_ALL_STACKS', data.rows)
    if (includeFieldOptions) {
      commit('REPLACE_ALL_FIELD_OPTIONS', data.field_options)
    }
  },
  /**
   * This action is called when the users scrolls to the end of the stack. Because
   * we don't fetch all the rows, the next set will be fetched when the user reaches
   * the end.
   */
  async fetchMore({ dispatch, commit, getters }, { selectOptionId }) {
    const stack = getters.getStack(selectOptionId)
    const { data } = await KanbanService(this.$client).fetchRows({
      kanbanId: getters.getLastKanbanId,
      limit: getters.getBufferRequestSize,
      offset: 0,
      includeFieldOptions: false,
      selectOptions: [
        {
          id: selectOptionId,
          limit: getters.getBufferRequestSize,
          offset: stack.results.length,
        },
      ],
    })
    const count = data.rows[selectOptionId].count
    const rows = data.rows[selectOptionId].results
    rows.forEach((row) => {
      populateRow(row)
    })
    commit('ADD_ROWS_TO_STACK', { selectOptionId, count, rows })
  },
  /**
   * Updates the field options of a given field in the store. So no API request to
   * the backend is made.
   */
  setFieldOptionsOfField({ commit }, { field, values }) {
    commit('UPDATE_FIELD_OPTIONS_OF_FIELD', {
      fieldId: field.id,
      values,
    })
  },
  /**
   * Replaces all field options with new values and also makes an API request to the
   * backend with the changed values. If the request fails the action is reverted.
   */
  async updateAllFieldOptions(
    { dispatch, getters },
    { kanban, newFieldOptions, oldFieldOptions, readOnly = false }
  ) {
    dispatch('forceUpdateAllFieldOptions', newFieldOptions)

    if (!readOnly) {
      const kanbanId = getters.getLastKanbanId
      const updateValues = { field_options: newFieldOptions }

      try {
        await ViewService(this.$client).updateFieldOptions({
          viewId: kanbanId,
          values: updateValues,
        })
      } catch (error) {
        dispatch('forceUpdateAllFieldOptions', oldFieldOptions)
        throw error
      }
    }
  },
  /**
   * Forcefully updates all field options without making a call to the backend.
   */
  forceUpdateAllFieldOptions({ commit }, fieldOptions) {
    commit('UPDATE_ALL_FIELD_OPTIONS', fieldOptions)
  },
  /**
   * Deletes the field options of the provided field id if they exist.
   */
  forceDeleteFieldOptions({ commit }, fieldId) {
    commit('DELETE_FIELD_OPTIONS', fieldId)
  },
  /**
   * Updates the order of all the available field options. The provided order parameter
   * should be an array containing the field ids in the correct order.
   */
  async updateFieldOptionsOrder(
    { commit, getters, dispatch },
    { order, readOnly = false }
  ) {
    const oldFieldOptions = clone(getters.getAllFieldOptions)
    const newFieldOptions = clone(getters.getAllFieldOptions)

    // Update the order of the field options that have not been provided in the order.
    // They will get a position that places them after the provided field ids.
    let i = 0
    Object.keys(newFieldOptions).forEach((fieldId) => {
      if (!order.includes(parseInt(fieldId))) {
        newFieldOptions[fieldId].order = order.length + i
        i++
      }
    })

    // Update create the field options and set the correct order value.
    order.forEach((fieldId, index) => {
      const id = fieldId.toString()
      if (Object.prototype.hasOwnProperty.call(newFieldOptions, id)) {
        newFieldOptions[fieldId.toString()].order = index
      }
    })

    return await dispatch('updateAllFieldOptions', {
      oldFieldOptions,
      newFieldOptions,
      readOnly,
    })
  },
  /**
   * Updates the field options of a specific field.
   */
  async updateFieldOptionsOfField(
    { commit, getters },
    { kanban, field, values, readOnly = false }
  ) {
    commit('UPDATE_FIELD_OPTIONS_OF_FIELD', {
      fieldId: field.id,
      values,
    })

    if (!readOnly) {
      const kanbanId = getters.getLastKanbanId
      const oldValues = clone(getters.getAllFieldOptions[field.id])
      const updateValues = { field_options: {} }
      updateValues.field_options[field.id] = values

      try {
        await ViewService(this.$client).updateFieldOptions({
          viewId: kanbanId,
          values: updateValues,
        })
      } catch (error) {
        commit('UPDATE_FIELD_OPTIONS_OF_FIELD', {
          fieldId: field.id,
          values: oldValues,
        })
        throw error
      }
    }
  },
  /**
   * Creates a new row and adds it to the state if needed.
   */
  async createNewRow(
    { dispatch, commit, getters },
    { view, table, fields, primary, values }
  ) {
    // First prepare an object that we can send to the
    const allFields = [primary].concat(fields)
    const preparedValues = {}
    allFields.forEach((field) => {
      const name = `field_${field.id}`
      const fieldType = this.$registry.get('field', field._.type.type)

      if (fieldType.isReadOnly) {
        return
      }

      preparedValues[name] = Object.prototype.hasOwnProperty.call(values, name)
        ? (preparedValues[name] = fieldType.prepareValueForUpdate(
            field,
            values[name]
          ))
        : fieldType.getEmptyValue(field)
    })

    const { data } = await RowService(this.$client).create(
      table.id,
      preparedValues
    )
    return await dispatch('createdNewRow', {
      view,
      values: data,
      fields,
      primary,
    })
  },
  /**
   * Can be called when a new row has been created. This action will make sure that
   * the state is updated accordingly. If the newly created position is within the
   * current buffer (`stack.results`), then it will be added there, otherwise, just
   * the count is increased.
   *
   * @param values  The values of the newly created row.
   * @param row     Can be provided when the row already existed within the state.
   *                In that case, the `_` data will be preserved. Can be useful when
   *                a row has been updated while being dragged.
   */
  async createdNewRow(
    { dispatch, commit, getters, rootGetters },
    { view, values, fields, primary }
  ) {
    const row = clone(values)
    populateRow(row)

    const matchesFilters = await dispatch('rowMatchesFilters', {
      view,
      row,
      fields,
      primary,
    })
    if (!matchesFilters) {
      return
    }

    const singleSelectFieldId = getters.getSingleSelectFieldId
    const option = row[`field_${singleSelectFieldId}`]
    const stackId = option !== null ? option.id : 'null'
    const stack = getters.getStack(stackId)

    const sortedRows = clone(stack.results)
    sortedRows.push(row)
    sortedRows.sort(getRowSortFunction(this.$registry, [], fields, primary))
    const index = sortedRows.findIndex((r) => r.id === row.id)
    const isLast = index === sortedRows.length - 1

    // Because we don't fetch all the rows from the backend, we can't know for sure
    // whether or not the row is being added at the right position. Therefore, if
    // it's last, we just not add it to the store and wait for the user to fetch the
    // next page.
    if (!isLast || stack.results.length === stack.count) {
      commit('CREATE_ROW', { row, stackId, index })
    }

    // We always need to increase the count whether row has been added to the store
    // or not because the count is for all the rows and not just the ones in the store.
    commit('INCREASE_COUNT', { stackId })
  },
  /**
   * Can be called when a row in the table has been deleted. This action will make
   * sure that the state is updated accordingly.
   */
  async deletedExistingRow(
    { dispatch, commit, getters },
    { view, row, fields, primary }
  ) {
    row = clone(row)
    populateRow(row)

    const matchesFilters = await dispatch('rowMatchesFilters', {
      view,
      row,
      fields,
      primary,
    })
    if (!matchesFilters) {
      return
    }

    const singleSelectFieldId = getters.getSingleSelectFieldId
    const option = row[`field_${singleSelectFieldId}`]
    const stackId = option !== null ? option.id : 'null'
    const current = getters.findStackIdAndIndex(row.id)

    if (current !== undefined) {
      const currentStackId = current[0]
      const currentIndex = current[1]
      const currentRow = current[2]
      commit('DELETE_ROW', { stackId: currentStackId, index: currentIndex })
      commit('DECREASE_COUNT', { stackId: currentStackId })
      return currentRow
    } else {
      commit('DECREASE_COUNT', { stackId })
    }

    return null
  },
  /**
   * Check if the provided row matches the provided view filters.
   */
  rowMatchesFilters(context, { view, fields, primary, row, overrides = {} }) {
    const values = JSON.parse(JSON.stringify(row))
    Object.assign(values, overrides)

    // The value is always valid if the filters are disabled.
    return view.filters_disabled
      ? true
      : matchSearchFilters(
          this.$registry,
          view.filter_type,
          view.filters,
          primary === null ? fields : [primary, ...fields],
          values
        )
  },
  /**
   * Can be called when a row in the table has been updated. This action will make sure
   * that the state is updated accordingly. If the single select field value has
   * changed, the row will be moved to the right stack. If the position has changed,
   * it will be moved to the right position.
   */
  async updatedExistingRow(
    { dispatch, getters, commit },
    { view, row, values, fields, primary }
  ) {
    const singleSelectFieldId = getters.getSingleSelectFieldId
    const fieldName = `field_${singleSelectFieldId}`

    // First, we virtually need to figure out if the row was in the old stack.
    const oldRow = populateRow(clone(row))
    const oldRowMatchesFilters = await dispatch('rowMatchesFilters', {
      view,
      row: oldRow,
      fields,
      primary,
    })
    const oldOption = oldRow[fieldName]
    const oldStackId = oldOption !== null ? oldOption.id : 'null'
    const oldStackResults = clone(getters.getStack(oldStackId).results)
    const oldExistingIndex = oldStackResults.findIndex(
      (r) => r.id === oldRow.id
    )
    const oldExists = oldExistingIndex > -1 && oldRowMatchesFilters

    // Second, we need to figure out if the row should be visible in the new stack.
    const newRow = Object.assign(populateRow(clone(row)), values)
    const newRowMatchesFilters = await dispatch('rowMatchesFilters', {
      view,
      row: newRow,
      fields,
      primary,
    })
    const newOption = newRow[fieldName]
    const newStackId = newOption !== null ? newOption.id : 'null'
    const newStack = getters.getStack(newStackId)
    const newStackResults = clone(newStack.results)
    const newRowCurrentIndex = newStackResults.findIndex(
      (r) => r.id === newRow.id
    )
    let newStackCount = newStack.count
    if (newRowCurrentIndex > -1) {
      newStackResults.splice(newRowCurrentIndex, 1)
      newStackCount--
    }
    newStackResults.push(newRow)
    newStackCount++
    newStackResults.sort(
      getRowSortFunction(this.$registry, [], fields, primary)
    )
    const newIndex = newStackResults.findIndex((r) => r.id === newRow.id)
    const newIsLast = newIndex === newStackResults.length - 1
    const newExists =
      (!newIsLast || newStackResults.length === newStackCount) &&
      newRowMatchesFilters

    commit('UPDATE_ROW', { row, values })

    if (oldExists && newExists) {
      commit('MOVE_ROW', {
        currentStackId: oldStackId,
        currentIndex: oldExistingIndex,
        targetStackId: newStackId,
        targetIndex: newIndex,
      })
      commit('DECREASE_COUNT', { stackId: oldStackId })
      commit('INCREASE_COUNT', { stackId: newStackId })
    } else if (oldExists && !newExists) {
      commit('DELETE_ROW', { stackId: oldStackId, index: oldExistingIndex })
      commit('DECREASE_COUNT', { stackId: oldStackId })
    } else if (!oldExists && newExists) {
      commit('CREATE_ROW', {
        row: newRow,
        stackId: newStackId,
        index: newIndex,
      })
      commit('INCREASE_COUNT', { stackId: newStackId })
    }
  },
  /**
   * The dragging of rows to other stacks and position basically consists of three+
   * steps. First is calling this action which brings the rows into dragging state
   * and stores what the current stack and and index was. A row in dragging state is
   * basically an invisible placeholder card that can be moved to other positions
   * using the available actions. When the row has been dragged to the right
   * position, the `stopRowDrag` action can be called to finalize it.
   */
  startRowDrag({ commit, getters }, { row }) {
    const current = getters.findStackIdAndIndex(row.id)
    const currentStackId = current[0]
    const currentIndex = current[1]
    const rows = getters.getStack(currentStackId).results
    const currentBefore = rows[currentIndex + 1] || null

    commit('START_ROW_DRAG', {
      row,
      currentStackId,
      currentBefore,
    })
  },
  /**
   * This action removes the dragging state of a row, will figure out which values
   * need to updated and will make a call to the backend. If something goes wrong,
   * the row is moved back to the original stack and position.
   */
  async stopRowDrag({ dispatch, commit, getters }, { table, fields, primary }) {
    const row = getters.getDraggingRow

    if (row === null) {
      return
    }

    // First we need to figure out what the current position of the row is and how
    // that should be communicated to the backend later. The backend expects another
    // row id where it is placed before or null if it's placed in the end.
    const originalStackId = getters.getDraggingOriginalStackId
    const originalBefore = getters.getDraggingOriginalBefore
    const current = getters.findStackIdAndIndex(row.id)
    const currentStackId = current[0]
    const currentIndex = current[1]
    const rows = getters.getStack(currentStackId).results
    const before = rows[currentIndex + 1] || null

    // We need to have the single select option field instance because we need
    // access to the available options. We can figure that out by looking looping
    // over the provided fields.
    const singleSelectField = [primary]
      .concat(fields)
      .find((field) => field.id === getters.getSingleSelectFieldId)
    const singleSelectFieldType = this.$registry.get(
      'field',
      SingleSelectFieldType.getType()
    )

    // We immediately want to update the single select value in the row, so we need
    // to extract the correct old value and the new value from the single select field
    // because that object holds all the options.
    const singleSelectFieldName = `field_${getters.getSingleSelectFieldId}`
    const oldSingleSelectFieldValue = row[singleSelectFieldName]
    const newSingleSelectFieldValue =
      singleSelectField.select_options.find(
        (option) => option.id === parseInt(currentStackId)
      ) || null

    // Prepare the objects that are needed to update the row directly in the store.
    const newValues = {}
    const oldValues = {}
    newValues[singleSelectFieldName] = newSingleSelectFieldValue
    oldValues[singleSelectFieldName] = oldSingleSelectFieldValue

    // Because the backend might accept a different format, we need to prepare the
    // values that we're going to send.
    const newValuesForUpdate = {}
    newValuesForUpdate[singleSelectFieldName] =
      singleSelectFieldType.prepareValueForUpdate(
        singleSelectField,
        newSingleSelectFieldValue
      )

    // Immediately update the row in the store and stop the dragging state.
    commit('UPDATE_ROW', { row, values: newValues })
    commit('STOP_ROW_DRAG', { row })

    // If the stack has changed, the value needs to be updated with the backend.
    if (originalStackId !== currentStackId) {
      commit('INCREASE_COUNT', { stackId: currentStackId })
      commit('DECREASE_COUNT', { stackId: originalStackId })
      try {
        const { data } = await RowService(this.$client).update(
          table.id,
          row.id,
          newValuesForUpdate
        )
        commit('UPDATE_ROW', { row, values: data })
      } catch (error) {
        // If for whatever reason updating the value fails, we need to undo the
        // things that have changed in the store.
        commit('UPDATE_ROW', { row, values: oldValues })
        commit('INCREASE_COUNT', { stackId: originalStackId })
        commit('DECREASE_COUNT', { stackId: currentStackId })
        dispatch('cancelRowDrag', { row, originalStackId })
        throw error
      }
    }

    // If the row is not before the same or if the stack has changed, we must update
    // the position.
    if (
      (before || { id: null }).id !== (originalBefore || { id: null }).id ||
      originalStackId !== currentStackId
    ) {
      try {
        const { data } = await RowService(this.$client).move(
          table.id,
          row.id,
          before !== null ? before.id : null
        )
        commit('UPDATE_ROW', { row, values: data })
      } catch (error) {
        dispatch('cancelRowDrag', { row, originalStackId })
        throw error
      }
    }
  },
  /**
   * Cancels the current row drag action by reverting back to the original position
   * while respecting any new rows that have been moved into there in the mean time.
   */
  cancelRowDrag({ dispatch, getters, commit }, { row, originalStackId }) {
    const current = getters.findStackIdAndIndex(row.id)

    if (current !== undefined) {
      const currentStackId = current[0]

      const sortedRows = clone(getters.getStack(originalStackId).results)
      if (currentStackId !== originalStackId) {
        // Only add the row to the temporary copy if it doesn't live the current stack.
        sortedRows.push(row)
      }
      sortedRows.sort(getRowSortFunction(this.$registry, [], [], null))
      const targetIndex = sortedRows.findIndex((r) => r.id === row.id)

      dispatch('forceMoveRowTo', {
        row,
        targetStackId: originalStackId,
        targetIndex,
      })
      commit('STOP_ROW_DRAG', { row })
    }
  },
  /**
   * Moves the provided row to the target stack at the provided index.
   *
   * @param row
   * @param targetStackId
   * @param targetIndex
   */
  forceMoveRowTo({ commit, getters }, { row, targetStackId, targetIndex }) {
    const current = getters.findStackIdAndIndex(row.id)

    if (current !== undefined) {
      const currentStackId = current[0]
      const currentIndex = current[1]

      if (currentStackId !== targetStackId || currentIndex !== targetIndex) {
        commit('MOVE_ROW', {
          currentStackId,
          currentIndex,
          targetStackId,
          targetIndex,
        })
        return true
      }
    }
    return false
  },
  /**
   * Moves the provided existing row before or after the provided target row.
   *
   * @param row           The row object that must be moved.
   * @param targetRow     Will be placed before or after the provided row.
   * @param targetBefore  Indicates whether the row must be moved before or after
   *                      the target row.
   */
  forceMoveRowBefore({ dispatch, getters }, { row, targetRow, targetBefore }) {
    const target = getters.findStackIdAndIndex(targetRow.id)

    if (target !== undefined) {
      const targetStackId = target[0]
      const targetIndex = target[1] + (targetBefore ? 0 : 1)

      return dispatch('forceMoveRowTo', { row, targetStackId, targetIndex })
    }
    return false
  },
  /**
   * Updates the value of a row and make the changes to the store accordingly.
   */
  async updateRowValue(
    { commit, dispatch },
    { view, table, row, field, fields, primary, value, oldValue }
  ) {
    const fieldType = this.$registry.get('field', field._.type.type)
    const allFields = [primary].concat(fields)
    const newValues = {}
    const newValuesForUpdate = {}
    const oldValues = {}
    const fieldName = `field_${field.id}`
    newValues[fieldName] = value
    newValuesForUpdate[fieldName] = fieldType.prepareValueForUpdate(
      field,
      value
    )
    oldValues[fieldName] = oldValue

    allFields.forEach((fieldToCall) => {
      const fieldType = this.$registry.get('field', fieldToCall._.type.type)
      const fieldToCallName = `field_${fieldToCall.id}`
      const currentFieldValue = row[fieldToCallName]
      const optimisticFieldValue = fieldType.onRowChange(
        row,
        fieldToCall,
        currentFieldValue
      )

      if (currentFieldValue !== optimisticFieldValue) {
        newValues[fieldToCallName] = optimisticFieldValue
        oldValues[fieldToCallName] = currentFieldValue
      }
    })

    await dispatch('updatedExistingRow', {
      view,
      row,
      values: newValues,
      fields,
      primary,
    })

    try {
      const { data } = await RowService(this.$client).update(
        table.id,
        row.id,
        newValuesForUpdate
      )
      commit('UPDATE_ROW', { row, values: data })
    } catch (error) {
      dispatch('updatedExistingRow', {
        view,
        row,
        values: oldValues,
        fields,
        primary,
      })
      throw error
    }
  },
  /**
   * Creates a new stack by updating the related field option of the view's
   * field. The values in the store also be updated accordingly.
   */
  async createStack(
    { getters, commit, dispatch },
    { fields, primary, color, value }
  ) {
    const field = [primary]
      .concat(fields)
      .find((field) => field.id === getters.getSingleSelectFieldId)

    const updateValues = {
      type: field.type,
      select_options: clone(field.select_options),
    }
    updateValues.select_options.push({ color, value })

    // Instead of using the field store, we manually update the existing field
    // because we need to extract the newly created select option id from the
    // response before the field is updated in the store.
    const { data } = await FieldService(this.$client).update(
      field.id,
      updateValues
    )

    // Extract the newly created select option id from the response and create an
    // empty stack with that id. The stack must exist before the field is updated
    // in the store, otherwise we could ran into vue errors because the stack is
    // expected.
    const selectOptionId =
      data.select_options[data.select_options.length - 1].id.toString()
    const stackObject = populateStack({
      count: 0,
      results: [],
    })
    commit('ADD_STACK', { id: selectOptionId, stack: stackObject })

    // After the stack has been created, we can update the field in the store.
    await dispatch(
      'field/forceUpdate',
      {
        field,
        oldField: clone(field),
        data,
        relatedFields: data.related_fields,
      },
      { root: true }
    )
  },
  /**
   * Updates the stack by updating the related field option of the view's field. The
   * values in the store also be updated accordingly.
   */
  async updateStack(
    { getters, commit, dispatch },
    { fields, primary, optionId, values }
  ) {
    const field = [primary]
      .concat(fields)
      .find((field) => field.id === getters.getSingleSelectFieldId)

    const options = clone(field.select_options)
    const index = options.findIndex((o) => o.id === optionId)
    Object.assign(options[index], values)

    const updateValues = {
      type: field.type,
      select_options: options,
    }
    const { data } = await FieldService(this.$client).update(
      field.id,
      updateValues
    )

    commit('UPDATE_VALUE_OF_ALL_ROWS_IN_STACK', {
      fieldId: field.id,
      stackId: optionId.toString(),
      values,
    })

    // After the stack has been updated, we can update the field in the store.
    await dispatch(
      'field/forceUpdate',
      {
        field,
        oldField: clone(field),
        data,
        relatedFields: data.related_fields,
      },
      { root: true }
    )
  },
  /**
   * Deletes an existing by updating the related field option of the view's single
   * select field.
   */
  async deleteStack(
    { getters, commit, dispatch },
    { fields, primary, optionId, deferredFieldUpdate = false }
  ) {
    const field = [primary]
      .concat(fields)
      .find((field) => field.id === getters.getSingleSelectFieldId)

    const options = clone(field.select_options)
    const index = options.findIndex((o) => o.id === optionId)
    options.splice(index, 1)

    const updateValues = {
      type: field.type,
      select_options: options,
    }
    const { data } = await FieldService(this.$client).update(
      field.id,
      updateValues
    )

    const doFieldUpdate = async () => {
      // After the stack has been updated, we can update the field in the store.
      await dispatch(
        'field/forceUpdate',
        {
          field,
          oldField: clone(field),
          data,
          relatedFields: data.related_fields,
        },
        { root: true }
      )
    }

    return deferredFieldUpdate ? doFieldUpdate : doFieldUpdate()
  },
  /**
   * Adds a field with a provided value to the rows in the store. This will for
   * example be called when a new field has been created.
   */
  addField({ commit }, { field, value = null }) {
    commit('ADD_FIELD_TO_ALL_ROWS', { field, value })
  },
}

export const getters = {
  getLastKanbanId(state) {
    return state.lastKanbanId
  },
  getSingleSelectFieldId(state) {
    return state.singleSelectFieldId
  },
  getAllFieldOptions(state) {
    return state.fieldOptions
  },
  getAllStacks: (state) => {
    return state.stacks
  },
  getStack: (state) => (id) => {
    return state.stacks[id.toString()]
  },
  stackExists: (state) => (id) => {
    return Object.prototype.hasOwnProperty.call(state.stacks, id.toString())
  },
  getBufferRequestSize(state) {
    return state.bufferRequestSize
  },
  isDraggingRow(state) {
    return !!state.draggingRow
  },
  getDraggingRow(state) {
    return state.draggingRow
  },
  getDraggingOriginalStackId(state) {
    return state.draggingOriginalStackId
  },
  getDraggingOriginalBefore(state) {
    return state.draggingOriginalBefore
  },
  getAllRows(state) {
    let rows = []
    Object.keys(state.stacks).forEach((key) => {
      rows = rows.concat(state.stacks[key].results)
    })
    return rows
  },
  findStackIdAndIndex: (state) => (rowId) => {
    const stacks = state.stacks
    const keys = Object.keys(stacks)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const results = stacks[key].results
      for (let i2 = 0; i2 < results.length; i2++) {
        const result = results[i2]
        if (result.id === rowId) {
          return [key, i2, result]
        }
      }
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
