import { TestApp } from '@baserow/test/helpers/testApp'
import ViewDecoratorContext from '@baserow/modules/database/components/view/ViewDecoratorContext'
import { DecoratorValueProviderType } from '@baserow/modules/database/decoratorValueProviders'
import { ViewDecoratorType } from '@baserow/modules/database/viewDecorators'

export class FakeDecoratorType extends ViewDecoratorType {
  static getType() {
    return 'fake_decorator'
  }

  getName() {
    return 'Fake decorator'
  }

  getDescription() {
    return 'Fake decorator description'
  }

  getImage() {
    return 'fake/url.png'
  }

  isCompatible(view) {
    return true
  }

  isDeactivated({ view }) {
    return false
  }

  getDeactivatedText() {
    return 'unavailability reason'
  }

  getComponent() {
    const component = {
      functional: true,

      render(h, ctx) {
        return h('div', `fake_decoration: ${ctx.props.value}`)
      },
    }
    return component
  }

  canAdd({ view }) {
    return [true]
  }
}

export class FakeValueProviderType extends DecoratorValueProviderType {
  static getType() {
    return 'fake_value_provider_type'
  }

  getName() {
    return 'Fake value provider'
  }

  getDescription() {
    return 'Fake value provider description.'
  }

  getIconClass() {
    return 'filter'
  }

  isCompatible() {
    return true
  }

  getFormComponent() {
    const component = {
      functional: true,

      render(h) {
        return h('div', 'fake_value_provider_form')
      },
    }
    return component
  }
}

const fieldData = [
  {
    id: 1,
    name: 'Name',
    order: 0,
    type: 'text',
    primary: true,
    text_default: '',
  },
  {
    id: 2,
    name: 'Surname',
    type: 'text',
    text_default: '',
    primary: false,
  },
  {
    id: 3,
    name: 'Status',
    type: 'single_select',
    text_default: '',
    primary: false,
  },
]

const rows = [
  { id: 2, order: '2.00000000000000000000', field_2: 'Bram' },
  { id: 4, order: '2.50000000000000000000', field_2: 'foo', field_3: 'bar' },
]

describe('GridViewRows component with decoration', () => {
  let testApp = null
  let mockServer = null
  let store = null
  let wrapperToDestroy = null

  beforeAll(() => {
    testApp = new TestApp()
    store = testApp.store
    mockServer = testApp.mockServer
    store.$registry.registerNamespace('viewDecorator')
    store.$registry.registerNamespace('decoratorValueProvider')
  })

  afterEach((done) => {
    // Clean up potentially registered stuff
    try {
      store.$registry.unregister('viewDecorator', 'fake_decorator')
    } catch {}
    try {
      store.$registry.unregister(
        'decoratorValueProvider',
        'fake_value_provider_type'
      )
    } catch {}
    if (wrapperToDestroy) {
      wrapperToDestroy.destroy()
      wrapperToDestroy = null
    }
    testApp.afterEach().then(done)
  })

  const populateStore = async ({ viewId = 1, decorations } = {}) => {
    const table = mockServer.createTable()
    const { application } = await mockServer.createAppAndGroup(table)
    const view = mockServer.createGridView(application, table, {
      decorations,
      viewId,
    })

    mockServer.createFields(application, table, fieldData)
    await store.dispatch('field/fetchAll', table)
    const primary = store.getters['field/getPrimary']
    const fields = store.getters['field/getAll']

    mockServer.createGridRows(view, fields, rows)
    await store.dispatch('page/view/grid/fetchInitial', {
      gridId: view.id,
      fields,
      primary,
    })
    await store.dispatch('view/fetchAll', { id: table.id })
    return { table, primary, fields, view }
  }

  const mountComponent = async (props) => {
    const wrapper = await testApp.mount(ViewDecoratorContext, {
      propsData: props,
    })

    await wrapper.vm.show(document.body)
    await wrapper.vm.$nextTick()

    // Allow to clean the DOM after the test
    wrapperToDestroy = wrapper

    return wrapper
  }

  test('Default component', async () => {
    const { table, primary, fields, view } = await populateStore()

    const fakeDecorator = new FakeDecoratorType({ app: testApp })
    const fakeValueProvider = new FakeValueProviderType({ app: testApp })

    store.$registry.register('viewDecorator', fakeDecorator)
    store.$registry.register('decoratorValueProvider', fakeValueProvider)

    const wrapper = await mountComponent({
      view,
      table,
      primary,
      fields,
      readOnly: false,
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  test('View with decoration configured', async () => {
    const { table, primary, fields, view } = await populateStore({
      decorations: [
        {
          type: 'fake_decorator',
          value_provider_type: 'fake_value_provider_type',
          value_provider_conf: {},
          _: { loading: false },
        },
        {
          type: 'fake_decorator',
          value_provider_type: '',
          value_provider_conf: {},
          _: { loading: false },
        },
      ],
    })

    const fakeDecorator = new FakeDecoratorType({ app: testApp })
    const fakeValueProvider = new FakeValueProviderType({ app: testApp })

    store.$registry.register('viewDecorator', fakeDecorator)
    store.$registry.register('decoratorValueProvider', fakeValueProvider)

    const wrapper = await mountComponent({
      view,
      table,
      primary,
      fields,
      readOnly: false,
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  test('Should show unavailable decorator tooltip', async () => {
    const { table, primary, fields, view } = await populateStore()

    const fakeDecorator = new FakeDecoratorType({ app: testApp })
    const fakeValueProvider = new FakeValueProviderType({ app: testApp })

    fakeDecorator.isDeactivated = () => true

    store.$registry.register('viewDecorator', fakeDecorator)
    store.$registry.register('decoratorValueProvider', fakeValueProvider)

    const wrapper = await mountComponent({
      view,
      table,
      primary,
      fields,
      readOnly: false,
    })

    await wrapper
      .find('.decorator-list > div:first-child')
      .trigger('mouseenter')

    expect(document.body).toMatchSnapshot()
  })

  test('Should show cant add decorator tooltip', async () => {
    const { table, primary, fields, view } = await populateStore()

    const fakeDecorator = new FakeDecoratorType({ app: testApp })
    const fakeValueProvider = new FakeValueProviderType({ app: testApp })

    fakeDecorator.canAdd = () => [false, "can't be added reason"]

    store.$registry.register('viewDecorator', fakeDecorator)
    store.$registry.register('decoratorValueProvider', fakeValueProvider)

    const wrapper = await mountComponent({
      view,
      table,
      primary,
      fields,
      readOnly: false,
    })

    await wrapper
      .find('.decorator-list > div:first-child')
      .trigger('mouseenter')

    expect(document.body).toMatchSnapshot()
  })
})
