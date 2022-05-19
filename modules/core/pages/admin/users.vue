<template>
  <div class="layout__col-2-scroll">
    <div class="admin-settings">
      <h1>Users</h1>
      <div class="control">
        <label class="control__label">{{ $t('field.first_name') }}</label>
        <div class="control__elements">
          <input
            v-model="first_name"
            :class="{ 'input--error': $v.first_name.$error }"
            type="text"
            class="input input--large"
            @blur="$v.first_name.$touch()"
          />
          <div v-if="$v.first_name.$error" class="error">
            {{ $t('error.minMaxLength', { min: 2, max: 150 }) }}
          </div>
        </div>
      </div>
      <div class="control">
        <label class="control__label">{{ $t('field.username') }}</label>
        <div class="control__elements">
          <input
            v-model="username"
            :class="{ 'input--error': $v.username.$error }"
            type="text"
            class="input input--large"
            @blur="$v.username.$touch()"
          />
          <div v-if="$v.username.$error" class="error">
            {{ $t('error.minMaxLength2', { min: 2, max: 150, }) }}
          </div>
        </div>
      </div>
      <div class="control">
        <label class="control__label">{{ $t('field.password') }}</label>
        <div class="control__elements">
          <input
            ref="password"
            v-model="password"
            :class="{ 'input--error': $v.password.$error }"
            type="password"
            class="input input--large"
            @blur="$v.password.$touch()"
          />
          <div v-if="$v.password.$error" class="error">
            {{ $t('error.passwordRequired') }}
          </div>
        </div>
      </div>
      <input type="checkbox" id="is_staff" v-model="is_staff" value="isStaff">
      <label for="is_staff"> Is Staff</label><br>
      <!-- <input type="radio" id="isStaff" name="is_staff" value="isStaff">
      <label for="isStaff">is_staff</label><br> -->
       <div class="actions">
        <slot></slot>
        <button
          @click="createUsers"
          :class="{ 'button--loading': loading }"
          class="button button--large"
          :disabled="loading"
        >
          {{ $t('action.create') }}
        </button>
      </div>

      <div class="control">
        <label class="control__label">User</label>
        <div class="control__elements">
          <select v-model="selectUser">
            <option v-for="item in users"
              :key="item.id" :value="item.id">{{item.first_name}}</option>
          </select>
          <!-- <div v-if="$v.first_name.$error" class="error">
            {{ $t('error.minMaxLength', { min: 2, max: 150 }) }}
          </div> -->
        </div>
      </div>
      <div class="control">
        <label class="control__label">Groups</label>
        <div class="control__elements">
          <select v-model="selectGroup" >
            <option v-for="item in groups"
              :key="item.id" :value="item.id">{{item.name}}</option>
          </select>
          <!-- <div v-if="$v.first_name.$error" class="error">
            {{ $t('error.minMaxLength', { min: 2, max: 150 }) }}
          </div> -->
        </div>
      </div>
      <div class="actions">
        <slot></slot>
        <button
          @click="assignUsers"
          :class="{ 'button--loading': loading2 }"
          class="button button--large"
          :disabled="loading2"
        >
          Assign
        </button>
      </div>
      <div v-if="isLoading" class="context--loading">
      <div class="loading"></div>
    </div>
    <ul
      v-if="!isLoading && isLoaded && users.length > 0"
      v-auto-overflow-scroll
      class="select__items"
    >
      <GroupsContextItem
        v-for="user in users"
        :key="user.id"
        v-sortable="{ id: user.id, update: order, marginTop: -1.5 }"
        :group="user"
        @selected="hide"
      ></GroupsContextItem>
    </ul>
    <div
      v-if="!isLoading && isLoaded && users.length == 0"
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
  helpers,
  required,
} from 'vuelidate/lib/validators'
import { notifyIf } from '@baserow/modules/core/utils/error'
import SettingsService from '@baserow/modules/core/services/settings'
import GroupsContextItem from '@baserow/modules/core/components/group/GroupsContextItemUsers'
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
      selectUser:'',
      selectGroup:'',
      loading: false,
      loading2: false,
      first_name:'',
      username:'',
      password:'',
      is_staff: false,
    }
  },
  computed: {
    ...mapState({
      groups: (state) => state.group.items,
    }),
    ...mapState({
      users: (state) => state.users.items,
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
      username: {
        required,
        helpers:helpers.regex('alpha', /^\S*$/),
        minLength: minLength(2),
        maxLength: maxLength(150),
      },
      first_name: {
        required,
        minLength: minLength(2),
        maxLength: maxLength(150),
      },
      password: { required },
  },
  mounted(){
    this.$store.dispatch('users/loadAll')
  },
  methods: {
    toggle(...args) {
      this.$store.dispatch('users/loadAll')
      this.getRootContext().toggle(...args)
    },
    async createUsers() {
      this.$v.$touch()
      if (this.$v.$invalid) {
        return
      }
      this.loading = true
      let obj = {
        first_name:this.first_name,
        username:this.username,
        password:this.password,
        is_staff:this.is_staff,
      }
     let res = await this.$store.dispatch('users/create',obj);
     if(res) this.loading = false
     console.log(res);
    },
    async assignUsers() {
      // this.$v.$touch()
      // if (this.$v.$invalid) {
      //   return
      // }
      this.loading2 = true
      let obj = {
        group:this.selectGroup,
        user:this.selectUser,
      }
     let res = await this.$store.dispatch('users/createUser',obj);
     if(res) this.loading2 = false
     console.log(res);
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
