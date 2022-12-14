<template>
  <div>
    <div>
      <div
        v-for="color in options.colors || []"
        :key="color.uid"
        v-sortable="{
          id: color.uid,
          update: orderColor,
          handle: '[data-sortable-handle]',
          marginTop: -5,
        }"
        class="conditional-color-value-provider-form__color"
      >
        <div class="conditional-color-value-provider-form__color-header">
          <div
            class="conditional-color-value-provider-form__color-handle"
            data-sortable-handle
          />
          <a
            :ref="`colorSelect-${color.uid}`"
            class="conditional-color-value-provider-form__color-color"
            :class="`background-color--${color.color}`"
            @click="openColor(color)"
          >
            <i class="fas fa-caret-down"></i>
          </a>
          <div :style="{ flex: 1 }" />
          <a
            v-if="options.colors.length > 1"
            class="conditional-color-value-provider-form__color-trash-link"
            @click="deleteColor(color)"
          >
            <i class="fa fa-trash" />
          </a>
        </div>
        <div
          v-if="color.filters.length === 0"
          class="conditional-color-value-provider-form__color-filter--empty"
        >
          {{ $t('conditionalColorValueProviderForm.colorAlwaysApply') }}
        </div>
        <ViewFieldConditionsForm
          v-show="color.filters.length !== 0"
          class="conditional-color-value-provider-form__color-filters"
          :filters="color.filters"
          :disable-filter="false"
          :filter-type="color.operator"
          :primary="primary"
          :fields="fields"
          :view="view"
          :read-only="readOnly"
          @deleteFilter="deleteFilter(color, $event)"
          @updateFilter="updateFilter(color, $event)"
          @selectOperator="updateColor(color, { operator: $event })"
        />
        <a
          class="conditional-color-value-provider-form__color-filter-add"
          @click.prevent="addFilter(color)"
        >
          <i class="fas fa-plus"></i>
          {{ $t('conditionalColorValueProviderForm.addCondition') }}</a
        >
        <ColorSelectContext
          :ref="`colorContext-${color.uid}`"
          @selected="updateColor(color, { color: $event })"
        ></ColorSelectContext>
      </div>
    </div>
    <a class="colors__add" @click.prevent="addColor()">
      <i class="fas fa-plus"></i>
      {{ $t('conditionalColorValueProviderForm.addColor') }}</a
    >
  </div>
</template>

<script>
import ViewFieldConditionsForm from '@baserow/modules/database/components/view/ViewFieldConditionsForm'
import ColorSelectContext from '@baserow/modules/core/components/ColorSelectContext'
import { ConditionalColorValueProviderType } from '@baserow_premium/decoratorValueProviders'

export default {
  name: 'ConditionalColorValueProvider',
  components: { ViewFieldConditionsForm, ColorSelectContext },
  props: {
    options: {
      type: Object,
      required: true,
    },
    view: {
      type: Object,
      required: true,
    },
    table: {
      type: Object,
      required: true,
    },
    primary: {
      type: Object,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    allFields() {
      return [this.primary, ...this.fields]
    },
  },
  methods: {
    orderColor(colorIds) {
      const newColors = colorIds.map((colorId) =>
        this.options.colors.find(({ uid }) => uid === colorId)
      )
      this.$emit('update', {
        colors: newColors,
      })
    },
    openColor(color) {
      this.$refs[`colorContext-${color.uid}`][0].setActive(color.color)
      this.$refs[`colorContext-${color.uid}`][0].toggle(
        this.$refs[`colorSelect-${color.uid}`][0],
        'bottom',
        'left',
        4
      )
    },
    addColor() {
      this.$emit('update', {
        colors: [
          ...this.options.colors,
          ConditionalColorValueProviderType.getDefaultColorConf(
            this.$registry,
            {
              fields: this.allFields,
            },
            true
          ),
        ],
      })
    },
    updateColor(color, values) {
      const newColors = this.options.colors.map((colorConf) => {
        if (colorConf.uid === color.uid) {
          return { ...colorConf, ...values }
        }
        return colorConf
      })

      this.$emit('update', {
        colors: newColors,
      })
    },
    deleteColor(color) {
      const newColors = this.options.colors.filter(({ uid }) => {
        return uid !== color.uid
      })

      this.$emit('update', {
        colors: newColors,
      })
    },
    addFilter(color) {
      const newColors = this.options.colors.map((colorConf) => {
        if (colorConf.uid === color.uid) {
          return {
            ...colorConf,
            filters: [
              ...colorConf.filters,
              ConditionalColorValueProviderType.getDefaultFilterConf(
                this.$registry,
                {
                  fields: this.allFields,
                }
              ),
            ],
          }
        }
        return colorConf
      })

      this.$emit('update', {
        colors: newColors,
      })
    },
    updateFilter(color, { filter, values }) {
      const newColors = this.options.colors.map((colorConf) => {
        if (colorConf.uid === color.uid) {
          const newFilters = colorConf.filters.map((filterConf) => {
            if (filterConf.id === filter.id) {
              return { ...filter, ...values }
            }
            return filterConf
          })
          return {
            ...colorConf,
            filters: newFilters,
          }
        }
        return colorConf
      })

      this.$emit('update', {
        colors: newColors,
      })
    },
    deleteFilter(color, filter) {
      const newColors = this.options.colors.map((colorConf) => {
        if (colorConf.uid === color.uid) {
          const newFilters = colorConf.filters.filter((filterConf) => {
            return filterConf.id !== filter.id
          })
          return {
            ...colorConf,
            filters: newFilters,
          }
        }
        return colorConf
      })

      this.$emit('update', {
        colors: newColors,
      })
    },
  },
}
</script>
