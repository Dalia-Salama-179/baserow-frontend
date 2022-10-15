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
            <div v-for="(key, idx) in Object.keys(comment.params.original_row_values)"
                 :class="{'dotted-line-separator': idx < Object.keys(comment.params.original_row_values).length-1 }">
                <p class="field-title color-black margin-top-1 d-flex margin-bottom-1 font-bold">
                    {{ fieldName(key) }} :
                </p>
                <div class="margin-top-0 margin-bottom-1">
                    <template v-if="Array.isArray(comment.params.original_row_values[key])">
                        <template v-if="comment.params.original_row_values[key] &&
                                        comment.params.original_row_values[key].length > 0">
                            <template v-for="(el, index) in comment.params.original_row_values[key]">
                                <div class="color-primary-dark"
                                   v-for="objKey in Object.keys(el)">
                                    <del class="old-val align-left forced-block"
                                         v-if="objKey !== 'id'"> {{ el[objKey] }}
                                    </del>
                                    <!--<p class="color-primary-dark margin-y0 align-right"
                                       v-if="objKey !== 'id' && comment.params.new_row_values[key][index]">
                                        {{comment.params.new_row_values[key][index][objKey]}}
                                    </p>-->
                                </div>
                            </template>
                        </template>

                        <template v-if="comment.params.new_row_values[key] &&
                                        comment.params.new_row_values[key].length > 0">
                            <template v-for="(el, index) in comment.params.new_row_values[key]">
                                <div class="color-primary-dark"
                                   v-for="objKey in Object.keys(el)">
                                    <!--<del class="old-val align-left forced-block"
                                         v-if="objKey !== 'id' && comment.params.original_row_values[key][index]">
                                        {{comment.params.original_row_values[key][index][objKey]}}
                                    </del>-->
                                    <p class="color-primary-dark align-right" v-if="objKey !== 'id'">
                                        {{ el[objKey] }}
                                    </p>
                                </div>
                            </template>
                        </template>
                    </template>


                    <div v-else class="color-primary-dark">
                        <del class="old-val align-left forced-block">
                            {{comment.params.original_row_values[key]}}
                        </del>
                        <p class="color-primary-dark margin-y0 align-right">
                            {{comment.params.new_row_values[key]}}
                        </p>
                    </div>
                </div>
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
        required: true
      }
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

    .old-val {
        color: #ed5a23;
    }
</style>