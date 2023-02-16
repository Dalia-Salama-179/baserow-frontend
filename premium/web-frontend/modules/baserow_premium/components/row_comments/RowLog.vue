<template>
  <div
    :class="{ 'row-comments__comment--right': ownComment }"
    class="row-comments__comment"
  >
    <div class="row-comments__comment-head">
      <div class="row-comments__comment-head-initial">
        {{ comment.user.first_name | nameAbbreviation }}
      </div>
      <div class="row-comments__comment-head-details">
        <div class="row-comments__comment-head-name">
          {{ ownComment ? $t('rowComment.you') : comment.user.first_name }}
        </div>
        <div :title="localTimestamp" class="row-comments__comment-head-time">
          {{ timeAgo }}
        </div>
      </div>
    </div>
    <div class="row-comments__comment-text white-space-normal">
      <template v-if="comment.type === 'update_row'">
        <div
          v-for="(key, idx) in comments"
          :key="idx"
          :class="{
            'dotted-line-separator': idx < comments.length - 1,
          }"
        >
          <p
            class="field-title color-black margin-top-1 d-flex margin-bottom-1 font-bold"
          >
            {{ fieldName(key) }} :
          </p>
          <div class="margin-top-0 margin-bottom-1">
            <template
              v-if="Array.isArray(comment.params.original_row_values[key])"
            >
              <template
                v-if="
                  comment.params.original_row_values[key] &&
                  comment.params.original_row_values[key].length > 0
                "
              >
                <template
                  v-for="(el, index) in comment.params.original_row_values[key]"
                >
                  <template v-if="typeof el === 'object'">
                    <div
                      v-for="(objKey, j) in Object.keys(el)"
                      :key="j"
                      class="color-primary-dark"
                    >
                      <del
                        v-if="objKey !== 'id'"
                        class="old-val align-left forced-block"
                      >
                        {{ el[objKey] }}
                      </del>
                    </div>
                  </template>
                  <div v-else :key="index" class="color-primary-dark">
                    <del class="old-val align-left forced-block">
                      {{ el }}
                    </del>
                  </div>
                </template>
              </template>

              <template
                v-if="
                  comment.params.new_row_values[key] &&
                  comment.params.new_row_values[key].length > 0
                "
              >
                <template
                  v-for="(el, index) in comment.params.new_row_values[key]"
                >
                  <template v-if="typeof el === 'object'">
                    <div
                      v-for="(objKey, j) in Object.keys(el)"
                      :key="j"
                      class="color-primary-dark"
                    >
                      <p
                        v-if="objKey !== 'id'"
                        class="color-primary-dark align-right"
                      >
                        {{ el[objKey] }}
                      </p>
                    </div>
                  </template>
                  <div v-else :key="index" class="color-primary-dark">
                    <p class="color-primary-dark align-right">
                      {{ el }}
                    </p>
                  </div>
                </template>
              </template>
            </template>

            <div v-else class="color-primary-dark">
              <del class="old-val align-left forced-block">
                {{ comment.params.original_row_values[key] }}
              </del>
              <p class="color-primary-dark margin-y0 align-right">
                {{ comment.params.new_row_values[key] }}
              </p>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <p
          class="field-title color-black margin-top-1 d-flex margin-bottom-1 font-bold"
        >
          {{ $t('rowComment.rowCreated') }}
        </p>
        <div
          v-for="(key, idx) in NewComments"
          :key="idx"
          :class="{
            'dotted-line-separator': idx < NewComments.length - 1,
          }"
        >
          <p
            class="field-title color-black margin-top-1 d-flex margin-bottom-1 font-bold"
          >
            {{ fieldName(key) }} :
          </p>
          <div class="margin-top-0 margin-bottom-1">
            <div class="color-primary-dark">
              <p class="color-primary-dark align-right">
                {{ comment.params.new_row_values[key] }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import moment from '@baserow/modules/core/moment'

export default {
  name: 'RowLog',
  props: {
    comment: {
      type: Object,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
  },
  computed: {
    ...mapGetters({
      userId: 'auth/getUserId',
    }),
    ownComment() {
      return this.comment.user.id === this.userId
    },
    comments() {
      const comments = Object.keys(this.comment.params.original_row_values)
      return comments.filter((e) => e !== 'id')
    },
    NewComments() {
      let comments = Object.keys(this.comment.params.new_row_values)
      comments = comments.map((x) => {
        if (
          this.comment.params.new_row_values[x] != '' &&
          this.comment.params.new_row_values[x] != null &&
          this.comment.params.new_row_values[x] != []
        ) {
          return x
        }
        return 'id'
      })
      return comments.filter((e) => e !== 'id')
    },
    timeAgo() {
      if (
        moment.utc(this.comment.created_on).fromNow() === 'a few seconds ago' ||
        moment.utc(this.comment.created_on).fromNow() === 'in a few seconds'
      ) {
        return 'in a minute'
      } else {
        return moment.utc(this.comment.created_on).fromNow()
      }
    },
    localTimestamp() {
      return moment.utc(this.comment.created_on).format('L LT')
    },
    fieldName() {
      return (id) =>
        this.fields.find((f) => f.id == id.replace('field_', ''))?.name
    },
  },
}
</script>

<style lang="scss" scoped>
.white-space-normal {
  white-space: normal;
}

.field-title {
  font-size: 1rem;
}

.old-val {
  color: #ed5a23;
}
</style>
