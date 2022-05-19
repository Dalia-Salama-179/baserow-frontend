import { Registerable } from '@baserow/modules/core/registry'
import ViewForm from '@baserow/modules/database/components/view/ViewForm'
import GridView from '@baserow/modules/database/components/view/grid/GridView'
import GridViewHeader from '@baserow/modules/database/components/view/grid/GridViewHeader'
import GalleryView from '@baserow/modules/database/components/view/gallery/GalleryView'
import GalleryViewHeader from '@baserow/modules/database/components/view/gallery/GalleryViewHeader'
import FormView from '@baserow/modules/database/components/view/form/FormView'
import FormViewHeader from '@baserow/modules/database/components/view/form/FormViewHeader'
import { FileFieldType } from '@baserow/modules/database/fieldTypes'
import { newFieldMatchesActiveSearchTerm } from '@baserow/modules/database/utils/view'

export const maxPossibleOrderValue = 32767

export class ViewType extends Registerable {
  /**
   * The font awesome 5 icon name that is used as convenience for the user to
   * recognize certain view types. If you for example want the database
   * icon, you must return 'database' here. This will result in the classname
   * 'fas fa-database'.
   */
  getIconClass() {
    return null
  }

  /**
   * The color class that is added to the icon.
   */
  getColorClass() {
    return 'color-primary'
  }

  /**
   * A human readable name of the view type.
   */
  getName() {
    return null
  }

  /**
   * Indicates whether it is possible to filter the rows. If true the filter context
   * menu is added to the header.
   */
  canFilter() {
    return true
  }

  /**
   * Indicates whether it is possible to sort the rows. If true the sort context menu
   * is added to the header.
   */
  canSort() {
    return true
  }

  /**
   * Indicates whether it is possible to share this view via an url publically.
   */
  canShare() {
    return false
  }

  constructor(...args) {
    super(...args)
    this.type = this.getType()
    this.iconClass = this.getIconClass()
    this.colorClass = this.getColorClass()
    this.canFilter = this.canFilter()
    this.canSort = this.canSort()
    this.canShare = this.canShare()

    if (this.type === null) {
      throw new Error('The type name of a view type must be set.')
    }
    if (this.iconClass === null) {
      throw new Error('The icon class of a view type must be set.')
    }
    if (this.name === null) {
      throw new Error('The name of a view type must be set.')
    }
  }

  /**
   * The form component that will be rendered when creating a new instance of
   * this view type. By default the ViewForm component is returned, but this
   * only contains a name field. If custom fields are required upon creating
   * they can be added by replacing this component with a custom oone.
   */
  getViewFormComponent() {
    return ViewForm
  }

  /**
   * Should return the component that will actually display the view.
   */
  getComponent() {
    throw new Error(
      'Not implemented error. This view should return a component.'
    )
  }

  /**
   * Should return a route name that will display the view when it has been
   * publicly shared.
   */
  getPublicRoute() {
    throw new Error(
      'Not implemented error. This method should be implemented to return a route' +
        ' name to a public page where the view can be seen.'
    )
  }

  /**
   * A human readable name of the view type to be used in the ShareViewLink and
   * related components. For example the link to share to view will have the text:
   * `Share {this.getSharingLinkName()}`
   */
  getSharingLinkName() {
    const { i18n } = this.app
    return i18n.t('viewType.sharing.linkName')
  }

  /**
   * Should return the component that will be displayed in the header when the
   * view is selected. Extra options like filters and sorting could be added
   * here.
   */
  getHeaderComponent() {
    return null
  }

  /**
   * Every time a fresh view object is fetched from the backend, it will be
   * populated, this is the moment to update some values. Because each view type
   * can have unique properties, they might need to be populated. This method
   * can be overwritten in order the populate the correct values.
   */
  populate(view) {
    return view
  }

  /**
   * Indicates whether of nor the provided table id has this current view type
   * selected. Because every view type has it's own store, this check can be used to
   * check if the state of that store has to be updated.
   */
  isCurrentView(store, tableId) {
    const table = store.getters['table/getSelected']
    const view = store.getters['view/getSelected']
    return (
      table.id === tableId &&
      Object.prototype.hasOwnProperty.call(view, 'type') &&
      view.type === this.getType()
    )
  }

  /**
   * The fetch method is called inside the asyncData function when the table page
   * loads with a selected view. It is possible to fill some stores serverside here.
   */
  fetch() {}

  /**
   * Should refresh the data inside a view. This is method could be called when a filter
   * or sort has been changed or when a field is updated or deleted. It should keep the
   * state as much the same as it was before. So for example the scroll offset should
   * stay the same if possible. Can throw a RefreshCancelledException when the view
   * wishes to cancel the current refresh call due to a new refresh call.
   */
  refresh(
    context,
    view,
    fields,
    primary,
    storePrefix = '',
    includeFieldOptions = false
  ) {}

  /**
   * Should return true if the view must be refreshed when a new field has been
   * created. This could for example be used to check whether the empty value matches
   * the active search term.
   */
  shouldRefreshWhenFieldCreated(registry, store, field, storePrefix) {
    return false
  }

  /**
   * Method that is called when a field has been created. This can be useful to
   * maintain data integrity for example to add the field to the grid view store.
   */
  afterFieldCreated(context, table, field, fieldType, storePrefix) {}

  /**
   * Method that is called when a field has been restored . This can be useful to
   * maintain data integrity for example to add the field to the grid view store.
   */
  fieldRestored(context, table, selectedView, field, fieldType, storePrefix) {}

  /**
   * Method that is called when a field has been deleted. This can be useful to
   * maintain data integrity.
   */
  afterFieldDeleted(context, field, fieldType, storePrefix) {}

  /**
   * Method that is called when a field has been changed. This can be useful to
   * maintain data integrity by updating the values.
   */
  afterFieldUpdated(context, field, oldField, fieldType, storePrefix) {}

  /**
   * Method that is called when the field options of a view are updated.
   */
  fieldOptionsUpdated(context, view, fieldOptions, storePrefix) {}

  /**
   * Method that is called when the selected view is updated.
   *
   * @return  Indicates whether the page should be refreshed. The view is already
   *          refreshed automatically when the filter type or disabled is updated.
   */
  updated(context, view, oldView, storePrefix) {
    return false
  }

  /**
   * Event that is called when a row is created from an outside source, so for example
   * via a real time event by another user. It can be used to check if data in an store
   * needs to be updated.
   */
  rowCreated(
    context,
    tableId,
    fields,
    primary,
    values,
    metadata,
    storePrefix
  ) {}

  /**
   * Event that is called when a row is updated from an outside source, so for example
   * via a real time event by another user. It can be used to check if data in an store
   * needs to be updated.
   */
  rowUpdated(
    context,
    tableId,
    fields,
    primary,
    row,
    values,
    metadata,
    storePrefix
  ) {}

  /**
   * Event that is called when a row is deleted from an outside source, so for example
   * via a real time event by another user. It can be used to check if data in an store
   * needs to be updated.
   */
  rowDeleted(context, tableId, fields, primary, row, storePrefix) {}

  /**
   * Event that is called when a piece of metadata is updated for a particular row.
   * A function which takes the current metadata value and applies the update is
   * provided and should be used to calculate and store the new metadata value for the
   * specified metadata type and row.
   */
  rowMetadataUpdated(
    { store },
    tableId,
    rowId,
    metadataType,
    updateFunction,
    storePrefix = ''
  ) {}

  /**
   * @return object
   */
  serialize() {
    return {
      type: this.type,
      iconClass: this.iconClass,
      colorClass: this.colorClass,
      name: this.getName(),
      canFilter: this.canFilter,
      canSort: this.canSort,
      canShare: this.canShare,
    }
  }

  /**
   * If the view type is disabled, this text will be visible explaining why.
   */
  getDeactivatedText() {}

  /**
   * Indicates if the view type is disabled.
   */
  isDeactivated() {
    return false
  }

  /**
   * Helper function to set a field value to null for all
   * views of the same type
   * Used when fields are converted or deleted and should no
   * longer be set
   */
  _setFieldToNull({ rootGetters, dispatch }, field, fieldName) {
    rootGetters['view/getAll']
      .filter((view) => view.type === this.type)
      .forEach((view) => {
        if (view[fieldName] === field.id) {
          dispatch(
            'view/forceUpdate',
            {
              view,
              values: { [fieldName]: null },
            },
            { root: true }
          )
        }
      })
  }
}

export class GridViewType extends ViewType {
  static getType() {
    return 'grid'
  }

  getIconClass() {
    return 'bars'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewType.grid')
  }

  getHeaderComponent() {
    return GridViewHeader
  }

  getComponent() {
    return GridView
  }

  canShare() {
    return true
  }

  getPublicRoute() {
    return 'database-public-grid-view'
  }

  async fetch({ store }, view, fields, primary, storePrefix = '') {
    await store.dispatch(storePrefix + 'view/grid/fetchInitial', {
      gridId: view.id,
      fields,
      primary,
    })
  }

  async refresh(
    { store },
    view,
    fields,
    primary,
    storePrefix = '',
    includeFieldOptions = false
  ) {
    await store.dispatch(storePrefix + 'view/grid/refresh', {
      view,
      fields,
      primary,
      includeFieldOptions,
    })
  }

  async fieldRestored(
    { dispatch, rootGetters },
    table,
    selectedView,
    field,
    fieldType,
    storePrefix = ''
  ) {
    // There might be new filters and sorts associated with the restored field,
    // ensure we create them. They will be included on the field data object if present.
    await dispatch(
      'view/fieldRestored',
      { field, fieldType, view: selectedView },
      { root: true }
    )
  }

  shouldRefreshWhenFieldCreated(registry, store, field, storePrefix) {
    const searchTerm =
      store.getters[storePrefix + 'view/grid/getActiveSearchTerm']
    return newFieldMatchesActiveSearchTerm(registry, field, searchTerm)
  }

  async afterFieldCreated(
    { dispatch },
    table,
    field,
    fieldType,
    storePrefix = ''
  ) {
    const value = fieldType.getEmptyValue(field)
    await dispatch(
      storePrefix + 'view/grid/addField',
      { field, value },
      { root: true }
    )
    await dispatch(
      storePrefix + 'view/grid/setFieldOptionsOfField',
      {
        field,
        // The default values should be the same as in the `GridViewFieldOptions`
        // model in the backend to stay consistent.
        values: {
          width: 200,
          hidden: false,
          order: maxPossibleOrderValue,
          aggregation_type: '',
          aggrgation_raw_type: '',
        },
      },
      { root: true }
    )
  }

  async afterFieldDeleted({ dispatch }, field, fieldType, storePrefix = '') {
    await dispatch(
      storePrefix + 'view/grid/forceDeleteFieldOptions',
      field.id,
      {
        root: true,
      }
    )
  }

  async afterFieldUpdated(
    { dispatch, rootGetters },
    field,
    oldField,
    fieldType,
    storePrefix
  ) {
    // The field changing may change which cells in the field should be highlighted so
    // we refresh them to ensure that they still correctly match. E.g. changing a date
    // fields date_format needs a search update as search string might no longer
    // match the new format.
    await dispatch(
      storePrefix + 'view/grid/updateSearch',
      {
        fields: rootGetters['field/getAll'],
        primary: rootGetters['field/getPrimary'],
      },
      {
        root: true,
      }
    )
  }

  async fieldOptionsUpdated({ store }, view, fieldOptions, storePrefix) {
    await store.dispatch(
      storePrefix + 'view/grid/forceUpdateAllFieldOptions',
      fieldOptions,
      {
        root: true,
      }
    )
  }

  async rowCreated(
    { store },
    tableId,
    fields,
    primary,
    values,
    metadata,
    storePrefix = ''
  ) {
    if (this.isCurrentView(store, tableId)) {
      await store.dispatch(storePrefix + 'view/grid/createdNewRow', {
        view: store.getters['view/getSelected'],
        fields,
        primary,
        values,
        metadata,
      })
      await store.dispatch(storePrefix + 'view/grid/fetchByScrollTopDelayed', {
        scrollTop: store.getters[storePrefix + 'view/grid/getScrollTop'],
        fields,
        primary,
      })
    }
  }

  async rowUpdated(
    { store },
    tableId,
    fields,
    primary,
    row,
    values,
    metadata,
    storePrefix = ''
  ) {
    if (this.isCurrentView(store, tableId)) {
      await store.dispatch(storePrefix + 'view/grid/updatedExistingRow', {
        view: store.getters['view/getSelected'],
        fields,
        primary,
        row,
        values,
        metadata,
      })
      await store.dispatch(storePrefix + 'view/grid/fetchByScrollTopDelayed', {
        scrollTop: store.getters[storePrefix + 'view/grid/getScrollTop'],
        fields,
        primary,
      })
    }
  }

  async rowDeleted({ store }, tableId, fields, primary, row, storePrefix = '') {
    if (this.isCurrentView(store, tableId)) {
      await store.dispatch(storePrefix + 'view/grid/deletedExistingRow', {
        view: store.getters['view/getSelected'],
        fields,
        primary,
        row,
      })
      await store.dispatch(storePrefix + 'view/grid/fetchByScrollTopDelayed', {
        scrollTop: store.getters[storePrefix + 'view/grid/getScrollTop'],
        fields,
        primary,
      })
    }
  }

  async rowMetadataUpdated(
    { store },
    tableId,
    rowId,
    rowMetadataType,
    updateFunction,
    storePrefix = ''
  ) {
    if (this.isCurrentView(store, tableId)) {
      await store.dispatch(storePrefix + 'view/grid/updateRowMetadata', {
        tableId,
        rowId,
        rowMetadataType,
        updateFunction,
      })
    }
  }
}

/**
 * This class can be used if the view store uses the `bufferedRows` mixin. It will
 * enable real time collaboration and will make sure that the rows are in the store
 * are updated properly.
 */
class BaseBufferedRowView extends ViewType {
  getDefaultFieldOptionValues() {
    return {}
  }

  async fetch({ store }, view, fields, primary, storePrefix = '') {
    await store.dispatch(`${storePrefix}view/${this.getType()}/fetchInitial`, {
      viewId: view.id,
      fields,
      primary,
    })
  }

  async refresh(
    { store },
    view,
    fields,
    primary,
    storePrefix = '',
    includeFieldOptions = false
  ) {
    await store.dispatch(storePrefix + 'view/' + this.getType() + '/refresh', {
      fields,
      primary,
      includeFieldOptions,
    })
  }

  async fieldRestored(
    { dispatch },
    table,
    selectedView,
    field,
    fieldType,
    storePrefix = ''
  ) {
    // There might be new filters and sorts associated with the restored field,
    // ensure we create them. They will be included on the field data object if present.
    await dispatch(
      'view/fieldRestored',
      { field, fieldType, view: selectedView },
      { root: true }
    )
  }

  shouldRefreshWhenFieldCreated(registry, store, field, storePrefix) {
    const searchTerm =
      store.getters[
        storePrefix + 'view/' + this.getType() + '/getActiveSearchTerm'
      ]
    return newFieldMatchesActiveSearchTerm(registry, field, searchTerm)
  }

  async afterFieldCreated(
    { dispatch },
    table,
    field,
    fieldType,
    storePrefix = ''
  ) {
    const value = fieldType.getEmptyValue(field)
    await dispatch(
      storePrefix + 'view/' + this.getType() + '/addField',
      { field, value },
      { root: true }
    )
    await dispatch(
      storePrefix + 'view/' + this.getType() + '/setFieldOptionsOfField',
      {
        field,
        values: this.getDefaultFieldOptionValues(),
      },
      { root: true }
    )
  }

  async afterFieldDeleted({ dispatch }, field, fieldType, storePrefix = '') {
    await dispatch(
      storePrefix + 'view/' + this.getType() + '/forceDeleteFieldOptions',
      field.id,
      {
        root: true,
      }
    )
  }

  async fieldOptionsUpdated({ store }, view, fieldOptions, storePrefix) {
    await store.dispatch(
      storePrefix + 'view/' + this.getType() + '/forceUpdateAllFieldOptions',
      fieldOptions,
      {
        root: true,
      }
    )
  }

  async rowCreated(
    { store },
    tableId,
    fields,
    primary,
    values,
    metadata,
    storePrefix = ''
  ) {
    if (this.isCurrentView(store, tableId)) {
      await store.dispatch(
        storePrefix + 'view/' + this.getType() + '/afterNewRowCreated',
        {
          view: store.getters['view/getSelected'],
          fields,
          primary,
          values,
        }
      )
    }
  }

  async rowUpdated(
    { store },
    tableId,
    fields,
    primary,
    row,
    values,
    metadata,
    storePrefix = ''
  ) {
    if (this.isCurrentView(store, tableId)) {
      await store.dispatch(
        storePrefix + 'view/' + this.getType() + '/afterExistingRowUpdated',
        {
          view: store.getters['view/getSelected'],
          fields,
          primary,
          row,
          values,
        }
      )
    }
  }

  async rowDeleted({ store }, tableId, fields, primary, row, storePrefix = '') {
    if (this.isCurrentView(store, tableId)) {
      await store.dispatch(
        storePrefix + 'view/' + this.getType() + '/afterExistingRowDeleted',
        {
          view: store.getters['view/getSelected'],
          fields,
          primary,
          row,
        }
      )
    }
  }
}

export class GalleryViewType extends BaseBufferedRowView {
  static getType() {
    return 'gallery'
  }

  getIconClass() {
    return 'th-large'
  }

  getColorClass() {
    return 'color-error'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewType.gallery')
  }

  getHeaderComponent() {
    return GalleryViewHeader
  }

  getComponent() {
    return GalleryView
  }

  getDefaultFieldOptionValues() {
    // The default values should be the same as in the `GalleryViewFieldOptions`
    // model in the backend to stay consistent.
    return {
      hidden: true,
      order: maxPossibleOrderValue,
    }
  }

  async afterFieldUpdated(
    { dispatch, rootGetters },
    field,
    oldField,
    fieldType,
    storePrefix
  ) {
    // If the field type has changed from a file field to something else, it could
    // be that there are gallery views that depending on that field. So we need to
    // change to type to null if that's the case.
    const type = FileFieldType.getType()
    if (oldField.type === type && field.type !== type) {
      this._setFieldToNull(
        { dispatch, rootGetters },
        field,
        'card_cover_image_field'
      )
    }
    // The field changing may change which cells in the field should be highlighted so
    // we refresh them to ensure that they still correctly match. E.g. changing a date
    // fields date_format needs a search update as search string might no longer
    // match the new format.
    await dispatch(
      storePrefix + 'view/gallery/updateSearch',
      {
        fields: rootGetters['field/getAll'],
        primary: rootGetters['field/getPrimary'],
      },
      {
        root: true,
      }
    )
  }

  afterFieldDeleted(context, field, fieldType, storePrefix = '') {
    // We want to loop over all gallery views that we have in the store and check if
    // they were depending on this deleted field. If that's case, we can set it to null
    // because it doesn't exist anymore.
    this._setFieldToNull(context, field, 'card_cover_image_field')
  }
}

export class FormViewType extends ViewType {
  static getType() {
    return 'form'
  }

  getIconClass() {
    return 'edit'
  }

  getColorClass() {
    return 'color-warning'
  }

  getName() {
    const { i18n } = this.app
    return i18n.t('viewType.form')
  }

  canFilter() {
    return false
  }

  canSort() {
    return false
  }

  canShare() {
    return true
  }

  getPublicRoute() {
    return 'database-table-form'
  }

  getSharingLinkName() {
    const { i18n } = this.app
    return i18n.t('viewType.sharing.formLinkName')
  }

  getHeaderComponent() {
    return FormViewHeader
  }

  getComponent() {
    return FormView
  }

  async refresh(
    { store },
    view,
    fields,
    primary,
    storePrefix = '',
    includeFieldOptions = false
  ) {
    await store.dispatch(storePrefix + 'view/form/fetchInitial', {
      formId: view.id,
    })
  }

  async afterFieldCreated(
    { dispatch },
    table,
    field,
    fieldType,
    storePrefix = ''
  ) {
    await dispatch(
      storePrefix + 'view/form/setFieldOptionsOfField',
      {
        field,
        // The default values should be the same as in the `FormViewFieldOptions`
        // model in the backend to stay consistent.
        values: {
          name: '',
          description: '',
          enabled: false,
          required: true,
          order: maxPossibleOrderValue,
        },
      },
      { root: true }
    )
  }

  async afterFieldDeleted({ dispatch }, field, fieldType, storePrefix = '') {
    await dispatch(
      storePrefix + 'view/form/forceDeleteFieldOptions',
      field.id,
      { root: true }
    )
  }

  async fetch({ store }, view, fields, primary, storePrefix = '') {
    await store.dispatch(storePrefix + 'view/form/fetchInitial', {
      formId: view.id,
    })
  }

  async fieldOptionsUpdated({ store }, view, fieldOptions, storePrefix) {
    await store.dispatch(
      storePrefix + 'view/form/forceUpdateAllFieldOptions',
      fieldOptions
    )
  }
}
