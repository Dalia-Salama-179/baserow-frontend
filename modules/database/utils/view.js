import { firstBy } from 'thenby'
import BigNumber from 'bignumber.js'
import { maxPossibleOrderValue } from '@baserow/modules/database/viewTypes'

/**
 * Generates a sort function based on the provided sortings.
 */
export function getRowSortFunction(
  $registry,
  sortings,
  fields,
  primary = null
) {
  let sortFunction = firstBy()

  sortings.forEach((sort) => {
    // Find the field that is related to the sort.
    let field = fields.find((f) => f.id === sort.field)
    if (field === undefined && primary !== null && primary.id === sort.field) {
      field = primary
    }

    if (field !== undefined) {
      const fieldName = `field_${field.id}`
      const fieldType = $registry.get('field', field.type)
      const fieldSortFunction = fieldType.getSort(fieldName, sort.order, field)
      sortFunction = sortFunction.thenBy(fieldSortFunction)
    }
  })

  sortFunction = sortFunction.thenBy((a, b) =>
    new BigNumber(a.order).minus(new BigNumber(b.order))
  )
  sortFunction = sortFunction.thenBy((a, b) => a.id - b.id)
  return sortFunction
}

/**
 * Generates a sort function for fields based on order and id.
 */
export function sortFieldsByOrderAndIdFunction(fieldOptions) {
  return (a, b) => {
    const orderA = fieldOptions[a.id]
      ? fieldOptions[a.id].order
      : maxPossibleOrderValue
    const orderB = fieldOptions[b.id]
      ? fieldOptions[b.id].order
      : maxPossibleOrderValue

    // First by order.
    if (orderA > orderB) {
      return 1
    } else if (orderA < orderB) {
      return -1
    }

    // Then by id.
    if (a.id < b.id) {
      return -1
    } else if (a.id > b.id) {
      return 1
    } else {
      return 0
    }
  }
}

/**
 * Returns only fields that are visible (not hidden).
 */
export function filterVisibleFieldsFunction(fieldOptions) {
  return (field) => {
    const exists = Object.prototype.hasOwnProperty.call(fieldOptions, field.id)
    return !exists || !fieldOptions[field.id].hidden
  }
}

/**
 * Returns only fields that are visible (not hidden).
 */
export function filterHiddenFieldsFunction(fieldOptions) {
  return (field) => {
    const exists = Object.prototype.hasOwnProperty.call(fieldOptions, field.id)
    return exists && fieldOptions[field.id].hidden
  }
}

/**
 * A helper function that checks if the provided row values match the provided view
 * filters. Returning false indicates that the row should not be visible for that
 * view.
 */
export const matchSearchFilters = (
  $registry,
  filterType,
  filters,
  fields,
  values
) => {
  // If there aren't any filters then it is not possible to check if the row
  // matches any of the filters, so we can mark it as valid.
  if (filters.length === 0) {
    return true
  }

  for (const i in filters) {
    const filter = filters[i]
    const filterValue = filter.value
    const rowValue = values[`field_${filter.field}`]
    const field = fields.find((f) => f.id === filter.field)
    const fieldType = $registry.get('field', field.type)
    const matches = $registry
      .get('viewFilter', filter.type)
      .matches(rowValue, filterValue, field, fieldType)
    if (filterType === 'AND' && !matches) {
      // With an `AND` filter type, the row must match all the filters, so if
      // one of the filters doesn't match we can mark it as isvalid.
      return false
    } else if (filterType === 'OR' && matches) {
      // With an 'OR' filter type, the row only has to match one of the filters,
      // that is the case here so we can mark it as valid.
      return true
    }
  }

  if (filterType === 'AND') {
    // When this point has been reached with an `AND` filter type it means that
    // the row matches all the filters and therefore we can mark it as valid.
    return true
  } else if (filterType === 'OR') {
    // When this point has been reached with an `OR` filter type it means that
    // the row matches none of the filters and therefore we can mark it as invalid.
    return false
  }
}

export function valueMatchesActiveSearchTerm(
  registry,
  field,
  value,
  activeSearchTerm
) {
  return registry
    .get('field', field.type)
    .containsFilter(value, activeSearchTerm, field)
}

function _findFieldsInRowMatchingSearch(
  row,
  activeSearchTerm,
  fields,
  registry,
  overrides
) {
  const fieldSearchMatches = new Set()
  // If the row is loading then a temporary UUID is put in its id. We don't want to
  // accidentally match against that UUID as it will be shortly replaced with its
  // real id.
  if (!row._.loading && row.id.toString().includes(activeSearchTerm)) {
    fieldSearchMatches.add('row_id')
  }
  for (const field of fields) {
    const fieldName = `field_${field.id}`
    const rowValue =
      fieldName in overrides ? overrides[fieldName] : row[fieldName]
    if (rowValue) {
      const doesMatch = valueMatchesActiveSearchTerm(
        registry,
        field,
        rowValue,
        activeSearchTerm
      )
      if (doesMatch) {
        fieldSearchMatches.add(field.id.toString())
      }
    }
  }

  return fieldSearchMatches
}

/**
 * Helper function which calculates if a given row and which of it's fields matches a
 * given search term. The rows values can be overridden by providing an overrides
 * object containing a mapping of the field name to override to a value that will be
 * used to check for matches instead of the rows real one. The rows values will not be
 * changed.
 */
export function calculateSingleRowSearchMatches(
  row,
  activeSearchTerm,
  hideRowsNotMatchingSearch,
  fields,
  registry,
  overrides = {}
) {
  const searchIsBlank = activeSearchTerm === ''
  const fieldSearchMatches = searchIsBlank
    ? new Set()
    : _findFieldsInRowMatchingSearch(
        row,
        activeSearchTerm,
        fields,
        registry,
        overrides
      )

  const matchSearch =
    !hideRowsNotMatchingSearch || searchIsBlank || fieldSearchMatches.size > 0
  return { row, matchSearch, fieldSearchMatches }
}

/**
 * Returns true is the empty value of the provided field matches the active search term.
 */
export function newFieldMatchesActiveSearchTerm(
  registry,
  newField,
  activeSearchTerm
) {
  if (newField && activeSearchTerm !== '') {
    const fieldType = registry.get('field', newField.type)
    const emptyValue = fieldType.getEmptyValue(newField)

    return valueMatchesActiveSearchTerm(
      registry,
      newField,
      emptyValue,
      activeSearchTerm
    )
  }
  return false
}
