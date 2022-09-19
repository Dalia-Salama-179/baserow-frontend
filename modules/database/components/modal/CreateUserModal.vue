<template>
    <Modal class="select-row-modal">
        <template #content>
            <div class="modal-padding">
                <form @submit.prevent="submit">
                    <FormElement :error="fieldHasErrors('first_name')" class="control">
                        <label class="control__label">
                            {{ $t('field.firstName') }}
                        </label>
                        <div class="control__elements">
                            <input
                                    ref="first_name"
                                    v-model="values.first_name"
                                    :class="{ 'input--error': fieldHasErrors('first_name') }"
                                    type="text"
                                    class="input input--large"
                                    @blur="$v.values.first_name.$touch()"
                            />
                            <div v-if="fieldHasErrors('first_name')" class="error">
                                {{ $t('error.minMaxLength', { min: 2, max: 150 }) }}
                            </div>
                        </div>
                    </FormElement>

                    <FormElement :error="fieldHasErrors('last_name')" class="control">
                        <label class="control__label">
                            {{ $t('field.lastName') }}
                        </label>
                        <div class="control__elements">
                            <input
                                    ref="last_name"
                                    v-model="values.last_name"
                                    :class="{ 'input--error': fieldHasErrors('last_name') }"
                                    type="text"
                                    class="input input--large"
                                    @blur="$v.values.last_name.$touch()"
                            />
                            <div v-if="fieldHasErrors('last_name')" class="error">
                                {{ $t('error.minMaxLength', { min: 2, max: 150 }) }}
                            </div>
                        </div>
                    </FormElement>

                    <FormElement :error="fieldHasErrors('username')" class="control">
                        <label class="control__label">{{ $t('field.username') }}</label>
                        <div class="control__elements">
                            <input
                                    v-model="values.username"
                                    :class="{ 'input--error': fieldHasErrors('username') }"
                                    type="text"
                                    class="input input--large"
                                    @blur="$v.values.username.$touch()"
                            />
                            <div v-if="fieldHasErrors('username')" class="error">
                                {{ $t('error.usernameRequired') }}
                            </div>
                            <template v-if="errors.hasOwnProperty('username')">
                                <p class="error" v-for="(e, index) in errors.username">
                                    {{e}}
                                    <span v-if="index < errors.username.length - 1">,</span>
                                </p>
                            </template>
                        </div>
                    </FormElement>


                    <FormElement :error="fieldHasErrors('email')" class="control">
                        <label class="control__label">{{ $t('field.emailAddress') }}</label>
                        <div class="control__elements">
                            <input
                                    ref="email"
                                    v-model="values.email"
                                    :class="{ 'input--error': fieldHasErrors('email') }"
                                    type="email"
                                    class="input input--large"
                                    @blur="$v.values.email.$touch()"
                            />
                            <div v-if="fieldHasErrors('email')" class="error">
                                {{ $t('error.invalidEmail') }}
                            </div>
                        </div>
                    </FormElement>
                    <FormElement :error="fieldHasErrors('password')" class="control">
                        <label class="control__label">{{ $t('field.password') }}</label>
                        <div class="control__elements">
                            <input
                                    ref="password"
                                    v-model="values.password"
                                    :class="{ 'input--error': fieldHasErrors('password') }"
                                    type="password"
                                    class="input input--large"
                                    @blur="$v.values.password.$touch()"
                            />
                            <div v-if="fieldHasErrors('password')" class="error">
                                {{ $t('error.passwordRequired') }}
                            </div>
                        </div>
                    </FormElement>

                    <Checkbox v-model="values.is_active">
                        {{$t('usersAdminTable.active')}}
                    </Checkbox>

                    <div class="actions">
                        <slot></slot>
                        <button
                                :class="{ 'button--loading': loading }"
                                class="button button--large"
                                :disabled="loading"
                        >
                            {{ $t('field.create') }}
                        </button>
                    </div>
                </form>
            </div>
        </template>
    </Modal>
</template>

<script>
  import modal from '@baserow/modules/core/mixins/modal'
  import { required, email, minLength, maxLength, helpers } from 'vuelidate/lib/validators'
  import form from '@baserow/modules/core/mixins/form'
  import error from '@baserow/modules/core/mixins/error'
  import stuffControlService from '@baserow/modules/database/services/stuff-control'

  export default {
    name: 'CreateUser',
    mixins: [form, error, modal],
    data() {
      return {
        loading: false,
        values: {
          email: '',
          password: '',
          is_active: true
        },
        errors: {}
      }
    },
    methods: {

      async submit() {
        this.$v.$touch()
        if (this.$v.$invalid) {
          this.focusOnFirstError()
          return
        }

        this.loading = true
        this.hideError()
        try {
          const response = await stuffControlService(this.$client).create(this.values)
          this.loading = false
          this.$emit('userCreated')
        } catch (error) {
          this.loading = false
          this.errors = error.response.data
        }
      }
    },
    validations: {
      values: {
        email: { email },
        password: { required },
        first_name: {
          minLength: minLength(2),
          maxLength: maxLength(150)
        },
        last_name: {
          minLength: minLength(2),
          maxLength: maxLength(150)
        },
        username: {
          required,
          helpers: helpers.regex('alpha', /^\S*$/),
          minLength: minLength(2),
          maxLength: maxLength(150)
        }
      }
    }
  }
</script>
