import Dropdown from '@baserow/modules/core/components/Dropdown'
import { TestApp } from '@baserow/test/helpers/testApp'

describe('Dropdown component', () => {
  let testApp = null

  beforeAll(() => {
    testApp = new TestApp()
  })

  afterEach(() => {
    testApp.afterEach()
  })

  const mountComponent = ({ props = {}, listeners = {}, slots = {} } = {}) => {
    return testApp.mount(Dropdown, { propsData: props, listeners, slots })
  }

  test('basics', async () => {
    const wrapper = await mountComponent()
    expect(wrapper.element).toMatchSnapshot()

    const wrapper2 = await mountComponent({ props: { showSearch: false } })
    expect(wrapper2.element).toMatchSnapshot()

    const wrapper3 = await mountComponent({ props: { disabled: true } })
    expect(wrapper3.element).toMatchSnapshot()
  })

  test('With items', async () => {
    const wrapper = await mountComponent({
      slots: {
        default: `<DropdownItem value="a" name="A"/>`,
      },
    })
    expect(wrapper.element).toMatchSnapshot()

    const wrapper2 = await mountComponent({
      props: { value: 'a' },
      slots: {
        default: `<DropdownItem value="a" name="A"/>
          <DropdownItem value="b" name="B"/>
          <DropdownItem value="c" name="C" :disabled="true"/>
          <DropdownItem value="d" name="D" icon="times"/>
          <DropdownItem value="e" name="E" description="My description"/>
          `,
      },
    })
    expect(wrapper2.element).toMatchSnapshot()

    const wrapper3 = await mountComponent({
      props: { value: 'a', showInput: false },
      slots: {
        default: `<DropdownItem value="a" name="A"/>
          <DropdownItem value="b" name="B"/>
          `,
      },
    })
    expect(wrapper3.element).toMatchSnapshot()
  })

  test('Test slots', async () => {
    const wrapper = await mountComponent({
      props: { value: 'a' },
      slots: {
        default: `<DropdownItem value="a" name="A">My item</DropdownItem>`,
        value: `<p>The value</p>`,
      },
    })
    expect(wrapper.element).toMatchSnapshot()
  })

  test('change value prop', async () => {
    const wrapper = await mountComponent({
      props: { value: 'a' },
      slots: {
        default: `<DropdownItem value="a" name="A"/>
          <DropdownItem value="b" name="B"/>`,
      },
    })

    wrapper.setProps({ value: 'b' })
    await wrapper.vm.$nextTick()
    expect(wrapper.element).toMatchSnapshot()
  })

  test('test interactions', async () => {
    let wrapper = null

    const onInput = jest.fn(async (newVal) => {
      wrapper.setProps({ value: newVal })
      await wrapper.vm.$nextTick()
    })

    wrapper = await mountComponent({
      props: { value: 'a' },
      slots: {
        default: `<DropdownItem value="a" name="A"/>
          <DropdownItem value="b" name="B"/>`,
      },
      listeners: { input: onInput },
    })

    await wrapper.find('.dropdown__selected').trigger('click')

    expect(wrapper.element).toMatchSnapshot()

    await wrapper
      .find('.select__items :nth-child(2)')
      .find('.select__item-link')
      .trigger('click')

    await wrapper.vm.$nextTick()

    expect(onInput).toHaveBeenCalledWith('b')

    expect(wrapper.element).toMatchSnapshot()
  })

  test('test focus', async () => {
    let wrapper = null

    const onInput = jest.fn(async (newVal) => {
      wrapper.setProps({ value: newVal })
      await wrapper.vm.$nextTick()
    })

    wrapper = await mountComponent({
      props: { value: 'a' },
      slots: {
        default: `<DropdownItem value="a" name="A"/>`,
      },
      listeners: { input: onInput },
    })

    await wrapper.find('.dropdown').trigger('focusin')

    expect(wrapper.element).toMatchSnapshot()

    await wrapper
      .find('.dropdown')
      .trigger('focusout', { relatedTarget: new EventTarget() })

    expect(wrapper.element).toMatchSnapshot()
  })
})
