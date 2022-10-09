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
            <div v-for="key in Object.keys(comment.params.original_row_values)">
                <p class="field-title margin-bottom-0">{{ fieldName(key) }}</p>
                <p class="margin-top-0 margin-bottom-1 color-primary-dark">
                    <del>{{comment.params.original_row_values[key]}}</del>
                    {{comment.params.new_row_values[key]}}
                </p>
            </div>
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
        required: true
      },
      fields: {
        type: Array,
        required: true,
      },
    },
    computed: {
      ...mapGetters({
        userId: 'auth/getUserId'
      }),
      ownComment() {
        return this.comment.user.id === this.userId
      },
      timeAgo() {
        return moment.utc(this.comment.created_on).fromNow()
      },
      localTimestamp() {
        return moment.utc(this.comment.created_on).format('L LT')
      },
      fieldName() {
        return (id) => this.fields.find(f => f.id == id.replace('field_', '')).name
      }
    }
  }
</script>

<style lang="scss" scoped>
    .white-space-normal {
        white-space: normal;
    }

    .field-title {
        font-size: 1rem;
    }
</style>