import { Registerable } from '@baserow/modules/core/registry'
import GenericViewAggregation from '@baserow/modules/database/components/aggregation/GenericViewAggregation'
import {
  FormulaFieldType,
  NumberFieldType,
} from '@baserow/modules/database/fieldTypes'

export class ViewAggregationType extends Registerable {
  /**
   * A human readable name of the aggregation type.
   */
  getName() {
    return null
  }

  /**
   * A human readable name of the aggregation type to display in the menu.
   */
  getShortName() {
    return this.getName()
  }

  /**
   * Returns the raw aggregation type which is used by the backend to compute the
   * aggregation.
   */
  getRawType() {
    return this.getType()
  }

  /**
   * Should return the field type names that the aggregation is compatible with or
   * functions which take a field and return a boolean indicating if the field is
   * compatible or not.
   *
   * So for example ['text', 'long_text']. You can create this type of aggregation
   * only for `text` and `long_text` field type.
   *
   * Or using a function you could do [(field) => field.some_prop === 10, 'long_text']
   * and then fields which pass the test defined by the function will be deemed as
   * compatible.
   *
   */
  getCompatibleFieldTypes() {
    return []
  }

  /**
   * Returns if a given field is compatible with this view aggregation or not.
   * Uses the list provided by getCompatibleFieldTypes to calculate this.
   */
  fieldIsCompatible(field) {
    for (const typeOrFunc of this.getCompatibleFieldTypes()) {
      if (typeOrFunc instanceof Function) {
        if (typeOrFunc(field)) {
          return true
        }
      } else if (field.type === typeOrFunc) {
        return true
      }
    }
    return false
  }

  /**
   * Should return the component that will actually display the aggregation.
   */
  getComponent() {
    throw new Error(
      'Not implemented error. This aggregation should return a component.'
    )
  }

  getOrder() {
    return 50
  }

  /**
   * Compute the final aggregation value from the value sent by the server and the given
   * context.
   * @param {*} value is the value from the backend.
   * @param {object} context is an object containing data to describe the context of the
   *    aggregation.
   * @returns the final aggregation value for this type.
   */
  getValue(value, context) {
    if (isNaN(value)) {
      return null
    }
    return value
  }

  /**
   * @return object
   */
  serialize() {
    return {
      type: this.type,
      rawType: this.getRawType(),
      name: this.getName(),
    }
  }
}

export class EmptyCountViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.emptyCount')
  }

  getCompatibleFieldTypes() {
    return [
      'text',
      'long_text',
      'url',
      'email',
      'number',
      'date',
      'last_modified',
      'created_on',
      'link_row',
      'file',
      'single_select',
      'multiple_select',
      'phone_number',
      FormulaFieldType.compatibleWithFormulaTypes(
        'text',
        'char',
        'date',
        'number'
      ),
    ]
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class NotEmptyCountViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'not_empty_count'
  }

  getRawType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.notEmptyCount')
  }

  getCompatibleFieldTypes() {
    return [
      'text',
      'long_text',
      'url',
      'email',
      'number',
      'date',
      'last_modified',
      'created_on',
      'link_row',
      'file',
      'single_select',
      'multiple_select',
      'phone_number',
      FormulaFieldType.compatibleWithFormulaTypes(
        'text',
        'char',
        'date',
        'number'
      ),
    ]
  }

  getValue(value, { rowCount }) {
    if (rowCount === 0) {
      return null
    }
    return rowCount - value
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class NotCheckedCountViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'not_checked_count'
  }

  getRawType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.notCheckedCount')
  }

  getCompatibleFieldTypes() {
    return ['boolean', FormulaFieldType.compatibleWithFormulaTypes('boolean')]
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class CheckedCountViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'checked_count'
  }

  getRawType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.checkedCount')
  }

  getCompatibleFieldTypes() {
    return ['boolean', FormulaFieldType.compatibleWithFormulaTypes('boolean')]
  }

  getValue(value, { rowCount }) {
    if (rowCount === 0 || isNaN(value)) {
      return null
    }
    return rowCount - value
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class EmptyPercentageViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'empty_percentage'
  }

  getRawType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.emptyPercentage')
  }

  getShortName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.emptyCount')
  }

  getCompatibleFieldTypes() {
    return [
      'text',
      'long_text',
      'url',
      'email',
      'number',
      'date',
      'last_modified',
      'created_on',
      'link_row',
      'file',
      'single_select',
      'multiple_select',
      'phone_number',
      FormulaFieldType.compatibleWithFormulaTypes(
        'text',
        'char',
        'date',
        'number'
      ),
    ]
  }

  getValue(value, { rowCount }) {
    if (rowCount === 0 || isNaN(value)) {
      return null
    }
    return `${Math.round((value / rowCount) * 100)}%`
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class NotEmptyPercentageViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'not_empty_percentage'
  }

  getRawType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.notEmptyPercentage')
  }

  getShortName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.notEmptyCount')
  }

  getCompatibleFieldTypes() {
    return [
      'text',
      'long_text',
      'url',
      'email',
      'number',
      'date',
      'last_modified',
      'created_on',
      'link_row',
      'file',
      'single_select',
      'multiple_select',
      'phone_number',
      FormulaFieldType.compatibleWithFormulaTypes(
        'text',
        'char',
        'date',
        'number'
      ),
    ]
  }

  getValue(value, { rowCount }) {
    if (rowCount === 0 || isNaN(value)) {
      return null
    }
    return `${Math.round(((rowCount - value) / rowCount) * 100)}%`
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class NotCheckedPercentageViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'not_checked_percentage'
  }

  getRawType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.notCheckedPercentage')
  }

  getShortName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.notCheckedCount')
  }

  getCompatibleFieldTypes() {
    return ['boolean', FormulaFieldType.compatibleWithFormulaTypes('boolean')]
  }

  getValue(value, { rowCount }) {
    if (rowCount === 0 || isNaN(value)) {
      return null
    }
    return `${Math.round((value / rowCount) * 100)}%`
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class CheckedPercentageViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'checked_percentage'
  }

  getRawType() {
    return 'empty_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.checkedPercentage')
  }

  getShortName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.checkedCount')
  }

  getCompatibleFieldTypes() {
    return ['boolean', FormulaFieldType.compatibleWithFormulaTypes('boolean')]
  }

  getValue(value, { rowCount }) {
    if (rowCount === 0 || isNaN(value)) {
      return null
    }
    return `${Math.round(((rowCount - value) / rowCount) * 100)}%`
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class UniqueCountViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'unique_count'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.uniqueCount')
  }

  getCompatibleFieldTypes() {
    return [
      'text',
      'long_text',
      'url',
      'email',
      'number',
      'date',
      'single_select',
      'phone_number',
      FormulaFieldType.compatibleWithFormulaTypes(
        'text',
        'char',
        'date',
        'number'
      ),
    ]
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class MinViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'min'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.min')
  }

  getCompatibleFieldTypes() {
    return [
      'number',
      'rating',
      FormulaFieldType.compatibleWithFormulaTypes('number'),
    ]
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class MaxViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'max'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.max')
  }

  getCompatibleFieldTypes() {
    return [
      'number',
      'rating',
      FormulaFieldType.compatibleWithFormulaTypes('number'),
    ]
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class EarliestDateViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'min_date'
  }

  getRawType() {
    return 'min'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.earliestDate')
  }

  getShortName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.earliestDateShort')
  }

  getCompatibleFieldTypes() {
    return [
      'date',
      'last_modified',
      'created_on',
      FormulaFieldType.compatibleWithFormulaTypes('date'),
    ]
  }

  getValue(value, { field, fieldType }) {
    if (!(typeof value === 'string')) {
      return null
    }
    return fieldType.toHumanReadableString(field, value)
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class LatestDateViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'max_date'
  }

  getRawType() {
    return 'max'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.latestDate')
  }

  getShortName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.latestDateShort')
  }

  getCompatibleFieldTypes() {
    return [
      'date',
      'last_modified',
      'created_on',
      FormulaFieldType.compatibleWithFormulaTypes('date'),
    ]
  }

  getValue(value, { field, fieldType }) {
    if (!(typeof value === 'string')) {
      return null
    }
    return fieldType.toHumanReadableString(field, value)
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class SumViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'sum'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.sum')
  }

  getCompatibleFieldTypes() {
    return [
      'number',
      'rating',
      FormulaFieldType.compatibleWithFormulaTypes('number'),
    ]
  }

  getComponent() {
    return GenericViewAggregation
  }
}
export class AverageViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'average'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.average')
  }

  getCompatibleFieldTypes() {
    return [
      'number',
      'rating',
      FormulaFieldType.compatibleWithFormulaTypes('number'),
    ]
  }

  getValue(value, { field, fieldType }) {
    if (isNaN(value)) {
      return null
    }
    if (fieldType.getType() === 'number') {
      return NumberFieldType.formatNumber(field, value)
    } else {
      return value && value.toFixed(2)
    }
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class StdDevViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'std_dev'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.stdDev')
  }

  getShortName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.stdDevShort')
  }

  getCompatibleFieldTypes() {
    return [
      'number',
      'rating',
      FormulaFieldType.compatibleWithFormulaTypes('number'),
    ]
  }

  getValue(value, { field, fieldType }) {
    if (isNaN(value)) {
      return null
    }
    if (fieldType.getType() === 'number') {
      return NumberFieldType.formatNumber(field, value)
    } else {
      return value && value.toFixed(2)
    }
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class VarianceViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'variance'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.variance')
  }

  getCompatibleFieldTypes() {
    return [
      'number',
      'rating',
      FormulaFieldType.compatibleWithFormulaTypes('number'),
    ]
  }

  getValue(value, { field, fieldType }) {
    if (isNaN(value)) {
      return null
    }
    if (fieldType.getType() === 'number') {
      return NumberFieldType.formatNumber(field, value)
    } else {
      return value && value.toFixed(2)
    }
  }

  getComponent() {
    return GenericViewAggregation
  }
}

export class MedianViewAggregationType extends ViewAggregationType {
  static getType() {
    return 'median'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewAggregationType.median')
  }

  getCompatibleFieldTypes() {
    return [
      'number',
      'rating',
      FormulaFieldType.compatibleWithFormulaTypes('number'),
    ]
  }

  getComponent() {
    return GenericViewAggregation
  }
}
