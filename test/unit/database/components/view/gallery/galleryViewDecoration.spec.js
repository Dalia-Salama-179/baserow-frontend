import { TestApp } from '@baserow/test/helpers/testApp'
import GalleryView from '@baserow/modules/database/components/view/gallery/GalleryView'
import { DecoratorValueProviderType } from '@baserow/modules/database/decoratorValueProviders'
import { ViewDecoratorType } from '@baserow/modules/database/viewDecorators'

export class FakeDecoratorType extends ViewDecoratorType {
  static getType() {
    return 'fake_decorator'
  }

  getPlace() {
    return 'first_cell'
  }

  isDeactivated({ view }) {
    return false
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
}

export class FakeValueProviderType extends DecoratorValueProviderType {
  static getType() {
    return 'fake_value_provider_type'
  }

  getValue({ options, fields, row }) {
    return 'fake_value'
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
    name: 'Address',
    type: 'text',
    text_default: '',
    primary: false,
  },
]

const rows = [
  {
    id: 2,
    order: '2.00000000000000000000',
    field_1: 'first',
    field_2: 'Bram',
  },
  {
    id: 4,
    order: '2.50000000000000000000',
    field_1: 'second',
    field_2: 'foo',
    field_3: 'bar',
  },
]

describe('GalleryView component with decoration', () => {
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
  })

  const mountComponent = (props, slots = {}) => {
    return testApp.mount(GalleryView, { propsData: props, slots })
  }

  const populateStore = async (decorations) => {
    const table = mockServer.createTable()
    const { application } = await mockServer.createAppAndGroup(table)
    const view = mockServer.createGalleryView(application, table, {
      decorations,
    })
    mockServer.createFields(application, table, fieldData)
    await store.dispatch('field/fetchAll', table)
    const primary = store.getters['field/getPrimary']
    const fields = store.getters['field/getAll']

    mockServer.createGalleryRows(view, fields, rows)
    await store.dispatch('page/view/gallery/fetchInitial', {
      viewId: 1,
      fields,
      primary,
    })
    await store.dispatch('view/fetchAll', { id: 1 })

    return { table, primary, fields, view }
  }

  test('Default component with first_cell decoration', async () => {
    const { table, primary, fields, view } = await populateStore([
      {
        type: 'fake_decorator',
        value_provider_type: 'fake_value_provider_type',
        value_provider_conf: {},
      },
      {
        type: 'fake_decorator',
        value_provider_type: 'fake_value_provider_type',
        value_provider_conf: {},
      },
    ])

    const fakeDecorator = new FakeDecoratorType({ app: testApp })
    const fakeValueProvider = new FakeValueProviderType({ app: testApp })

    store.$registry.register('viewDecorator', fakeDecorator)
    store.$registry.register('decoratorValueProvider', fakeValueProvider)

    const wrapper1 = await mountComponent({
      table,
      view,
      primary,
      fields,
      readOnly: false,
      storePrefix: 'page/',
    })

    expect(wrapper1.element).toMatchSnapshot()
  })

  test('Default component with row wrapper decoration', async () => {
    const { table, primary, fields, view } = await populateStore([
      {
        type: 'fake_decorator',
        value_provider_type: 'fake_value_provider_type',
        value_provider_conf: {},
      },
      {
        type: 'fake_decorator',
        value_provider_type: 'fake_value_provider_type',
        value_provider_conf: {},
      },
    ])

    const fakeDecorator = new FakeDecoratorType({ app: testApp })
    const fakeValueProvider = new FakeValueProviderType({ app: testApp })

    fakeDecorator.getPlace = () => 'wrapper'
    fakeDecorator.getComponent = () => {
      const component = {
        functional: true,

        render(h, ctx) {
          return h(
            'div',
            { class: { 'test-wrapper': true } },
            ctx.slots().default
          )
        },
      }
      return component
    }

    store.$registry.register('viewDecorator', fakeDecorator)
    store.$registry.register('decoratorValueProvider', fakeValueProvider)

    const wrapper1 = await mountComponent({
      table,
      view,
      primary,
      fields,
      readOnly: false,
      storePrefix: 'page/',
    })

    expect(wrapper1.element).toMatchSnapshot()
  })

  test('Default component with unavailable decoration', async () => {
    const { table, primary, fields, view } = await populateStore([
      {
        type: 'fake_decorator',
        value_provider_type: 'fake_value_provider_type',
        value_provider_conf: {},
      },
    ])

    const fakeDecorator = new FakeDecoratorType({ app: testApp })
    const fakeValueProvider = new FakeValueProviderType({ app: testApp })

    fakeDecorator.isDeactivated = () => true

    store.$registry.register('viewDecorator', fakeDecorator)
    store.$registry.register('decoratorValueProvider', fakeValueProvider)

    const wrapper1 = await mountComponent({
      table,
      view,
      primary,
      fields,
      readOnly: false,
      storePrefix: 'page/',
    })

    expect(wrapper1.element).toMatchSnapshot()
  })
})
