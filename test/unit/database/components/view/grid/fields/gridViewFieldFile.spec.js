import { TestApp } from '@baserow/test/helpers/testApp'
import GridViewFieldFile from '@baserow/modules/database/components/view/grid/fields/GridViewFieldFile'
import UploadFileUserFileUpload from '@baserow/modules/core/components/files/UploadFileUserFileUpload'

describe('GridViewFieldFile component', () => {
  let testApp = null

  beforeAll(() => {
    testApp = new TestApp()
  })

  afterEach((done) => {
    testApp.afterEach().then(done)
  })

  const mountComponent = (props, slots = {}) => {
    return testApp.mount(GridViewFieldFile, { propsData: props, slots })
  }

  const field = {
    id: 1,
    name: 'File',
    order: 0,
    type: 'file',
    primary: false,
    text_default: '',
    _: {
      loading: false,
    },
  }

  const event = {
    target: {
      files: [
        {
          name: 'test.txt',
          size: 500,
          type: 'text/plain',
        },
      ],
    },
  }

  test('File upload modal should stay open when trash button is clicked', async () => {
    const wrapper = await mountComponent({
      field,
      readOnly: false,
      selected: true,
      storePrefix: 'page/',
      value: [],
    })

    await wrapper.find('.grid-field-file__item-add').trigger('click')

    // Manually call file input change event handler
    wrapper.findComponent(UploadFileUserFileUpload).vm.addFile(event)
    await wrapper.vm.$nextTick()

    const documentClick = jest.fn()
    document.body.addEventListener('click', documentClick)

    // After clicking remove file, the modal should still be visible
    await wrapper.find('.upload-files__state-link').trigger('click')
    expect(documentClick).not.toHaveBeenCalled()
  })
})
