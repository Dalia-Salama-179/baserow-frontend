<template>
  <div class="layout__col-2-scroll">
    <div class="admin-settings">
      <h1>Group</h1>
      <div class="control">
        <label class="control__label">{{ $t('field.name') }}</label>
        <div class="control__elements">
          <input
            v-model="name"
            :class="{ 'input--error': $v.name.$error }"
            type="text"
            class="input input--large"
            @blur="$v.name.$touch()"
          />
          <div v-if="$v.name.$error" class="error">
            {{ $t('error.minMaxLength', { min: 2, max: 160 }) }}
          </div>
        </div>
        <div class="actions">
        <slot></slot>
        <button
          @click="createGroup"
          :class="{ 'button--loading': loading }"
          class="button button--large"
          :disabled="loading"
        >
          {{ $t('action.create') }}
        </button>
      </div>
      </div>
          <div v-if="isLoading" class="context--loading">
      <div class="loading"></div>
    </div>
    <ul
      v-if="!isLoading && isLoaded && groups.length > 0"
      v-auto-overflow-scroll
      class="select__items"
    >
      <GroupsContextItem
        v-for="group in groups"
        :key="group.id"
        v-sortable="{ id: group.id, update: order, marginTop: -1.5 }"
        :group="group"
        @selected="hide"
      ></GroupsContextItem>
    </ul>
    <div
      v-if="!isLoading && isLoaded && groups.length == 0"
      class="context__description"
    >
      {{ $t('groupsContext.noResults') }}
    </div>
    <ul
      v-if="!isLoading && isLoaded && groupsUsers.length > 0"
      v-auto-overflow-scroll
      class="select__items"
    >
      <GroupsContextItem
        v-for="group in groupsUsers"
        :key="group.id"
        v-sortable="{ id: group.id, update: order, marginTop: -1.5 }"
        :group="group"
        @selected="hide"
      ></GroupsContextItem>
    </ul>
    <div
      v-if="!isLoading && isLoaded && groupsUsers.length == 0"
      class="context__description"
    >
      {{ $t('groupsContext.noResults') }}
    </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import {
  maxLength,
  minLength,
  required,
} from 'vuelidate/lib/validators'
import { notifyIf } from '@baserow/modules/core/utils/error'
import SettingsService from '@baserow/modules/core/services/settings'
import GroupsContextItem from '@baserow/modules/core/components/group/GroupsContextItem'
import { escapeRegExp } from '@baserow/modules/core/utils/string'

export default {
  layout: 'app',
  middleware: 'staff',
  components: {
    GroupsContextItem,
  },
  async asyncData({ app }) {
    const { data } = await SettingsService(app.$client).getInstanceID()
    return { instanceId: data.instance_id }
  },
   data() {
    return {
      loading: false,
      name:''
    }
  },
  computed: {
    ...mapState({
      groups: (state) => state.group.items,
    }),
    ...mapState({
      groupsUsers: (state) => state.group.itemsUsers,
    }),
    ...mapGetters({
      isLoading: 'group/isLoading',
      isLoaded: 'group/isLoaded',
    }),
  },
    validations: {
    name: {
        required,
        minLength: minLength(2),
        maxLength: maxLength(160),
      },
  },
  mounted(){
    this.$store.dispatch('group/loadAll')
  },
  methods: {
    toggle(...args) {
      this.$store.dispatch('group/loadAll')
      this.getRootContext().toggle(...args)
    },
    async createGroup() {
      this.$v.$touch()
      if (this.$v.$invalid) {
        return
      }
      this.loading = true
      // this.hideError()
      let obj = {
        name:this.name
      }
     let res = await this.$store.dispatch('group/create',obj);
     if(res) this.loading = false
    //  console.log(res);
    },
    searchAndSort(groups) {
      const query = this.query

      return groups
        .filter(function (group) {
          const regex = new RegExp('(' + escapeRegExp(query) + ')', 'i')
          return group.name.match(regex)
        })
        .sort((a, b) => {
          return a.order - b.order
        })
    },
    async order(order, oldOrder) {
      try {
        await this.$store.dispatch('group/order', {
          order,
          oldOrder,
        })
      } catch (error) {
        notifyIf(error, 'group')
      }
    },
  },
}
</script>
