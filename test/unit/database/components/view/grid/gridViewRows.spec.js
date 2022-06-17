import { TestApp } from '@baserow/test/helpers/testApp'
import GridViewRows from '@baserow/modules/database/components/view/grid/GridViewRows'

describe('GridViewRows component', () => {
  let testApp = null
  let mockServer = null
  let store = null

  beforeAll(() => {
    testApp = new TestApp()
    store = testApp.store
    mockServer = testApp.mockServer
  })

  afterEach((done) => {
    testApp.afterEach().then(done)
  })

  const mountComponent = (props, slots = {}) => {
    return testApp.mount(GridViewRows, { propsData: props, slots })
  }

  const primary = {
    id: 1,
    name: 'Name',
    order: 0,
    type: 'text',
    primary: true,
    text_default: '',
    _: {
      loading: false,
    },
  }

  const fieldData = [
    {
      id: 2,
      name: 'Surname',
      type: 'text',
      text_default: '',
      primary: false,
      _: {
        loading: false,
      },
    },
    {
      id: 3,
      name: 'Address',
      type: 'text',
      text_default: '',
      primary: false,
      _: {
        loading: false,
      },
    },
  ]

  const rows = [
    { id: 2, order: '2.00000000000000000000', field_2: 'Bram' },
    { id: 4, order: '2.50000000000000000000', field_2: 'foo', field_3: 'bar' },
    { id: 3, order: '3.00000000000000000000', field_3: 'Jo' },
  ]

  const populateStore = async () => {
    const table = mockServer.createTable()
    const { application } = await mockServer.createAppAndGroup(table)
    const view = mockServer.createGridView(application, table, {})
    const fields = mockServer.createFields(application, table, fieldData)

    mockServer.createGridRows(view, fields, rows)
    await store.dispatch('page/view/grid/fetchInitial', {
      gridId: 1,
      fields,
      primary,
    })
    await store.dispatch('view/fetchAll', { id: 1 })
    return { table, fields, view }
  }

  test('Default component', async () => {
    const { fields, view } = await populateStore()

    const wrapper1 = await mountComponent({
      view,
      fields,
      allFields: fields,
      leftOffset: 0,
      readOnly: false,
      includeRowDetails: false,
      storePrefix: 'page/',
    })

    expect(wrapper1.element).toMatchSnapshot()
  })

  test('With row details', async () => {
    const { fields, view } = await populateStore()

    const wrapper1 = await mountComponent({
      view,
      fields,
      allFields: fields,
      leftOffset: 0,
      readOnly: false,
      includeRowDetails: true,
      storePrefix: 'page/',
    })

    expect(wrapper1.element).toMatchSnapshot()
  })
})
