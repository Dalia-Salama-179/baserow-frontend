<template>
  <div v-if="!loaded && loading" class="loading-absolute-center" />
  <div v-else>
    <div class="row-comments">
      <div v-if="totalCount === 0" class="row-comments__empty">
        <i class="row-comments__empty-icon fas fa-comments"></i>
        <div class="row-comments__empty-text">
          <template v-if="readOnly">{{
            $t('rowCommentSidebar.readOnlyNoComment')
          }}</template>
          <template v-else>
            {{ $t('rowCommentSidebar.noComment') }}
          </template>
        </div>
      </div>
      <div v-else class="row-comments__body">
        <InfiniteScroll
          ref="infiniteScroll"
          :current-count="currentCount"
          :max-count="totalCount"
          :loading="loading"
          :reverse="true"
          @load-next-page="nextPage"
        >
          <template #default>
            <div v-for="c in comments" :key="c.id">
              <template
                v-if="
                  c.type === 'create_row' ||
                  getKey(c) !=
                    getFieldByName('potential_duplicate', false, fields)
                "
              >
                <RowLog
                  v-if="c.type === 'update_row' || c.type === 'create_row'"
                  :key="'row-log-' + c.id"
                  :comment="c"
                  :fields="fields"
                />
                <RowComment v-else :key="'row-comment-' + c.id" :comment="c" />
              </template>
            </div>
          </template>
          <template #end>
            <div class="row-comments__end-line"></div>
          </template>
        </InfiniteScroll>
      </div>
      <div v-if="!readOnly" class="row-comments__foot">
        <AutoExpandableTextareaInput
          ref="AutoExpandableTextarea"
          v-model="comment"
          :placeholder="$t('rowCommentSidebar.comment')"
          @entered="postComment"
        >
        </AutoExpandableTextareaInput>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { notifyIf } from '@baserow/modules/core/utils/error'
import { PremiumPlugin } from '@baserow_premium/plugins'
import RowComment from '@baserow_premium/components/row_comments/RowComment'
import RowLog from '@baserow_premium/components/row_comments/RowLog'
import InfiniteScroll from '@baserow/modules/core/components/helpers/InfiniteScroll'
import AutoExpandableTextareaInput from '@baserow/modules/core/components/helpers/AutoExpandableTextareaInput'
import gridViewHelpers from '@baserow/modules/database/mixins/gridViewHelpers'

export default {
  name: 'RowCommentsSidebar',
  components: {
    AutoExpandableTextareaInput,
    InfiniteScroll,
    RowComment,
    RowLog,
  },
  mixins: [gridViewHelpers],
  props: {
    table: {
      required: true,
      type: Object,
    },
    row: {
      required: true,
      type: Object,
    },
    readOnly: {
      required: true,
      type: Boolean,
    },
    fields: {
      type: Array,
      required: true,
    },
    rerenderUpdate: {
      type: Number,
      required: false,
    },
  },
  data() {
    return {
      comment: '',
    }
  },
  computed: {
    validPremiumLicense() {
      return PremiumPlugin.hasValidPremiumLicense(this.additionalUserData)
    },
    ...mapGetters({
      // comments: 'row_comments/getSortedRowComments',
      comments: 'row_comments/getSortedRowCommentsActivityLog',
      loading: 'row_comments/getLoading',
      loaded: 'row_comments/getLoaded',
      currentCount: 'row_comments/getCurrentCount',
      totalCount: 'row_comments/getTotalCount',
      additionalUserData: 'auth/getAdditionalUserData',
    }),
  },
  watch: {
    rerenderUpdate() {
      this.getData()
    },
  },
  async created() {
    await this.getData()
  },
  methods: {
    async getData() {
      /* if (!this.validPremiumLicense) {
      return
    } */
      this.$store.dispatch('row_comments/clearCommentsAndLog')
      try {
        const tableId = this.table.id
        const rowId = this.row.id
        await this.$store.dispatch('row_comments/fetchRowComments', {
          tableId,
          rowId,
        })
      } catch (e) {
        notifyIf(e, 'application')
      }
    },
    async postComment() {
      const comment = this.comment.trim()
      if (!comment || this.readOnly) {
        return
      }
      try {
        const tableId = this.table.id
        const rowId = this.row.id
        this.comment = ''
        await this.$store.dispatch('row_comments/postComment', {
          tableId,
          rowId,
          comment,
        })
        this.$refs.infiniteScroll.scrollToStart()
      } catch (e) {
        notifyIf(e, 'application')
      }
    },
    async nextPage() {
      try {
        const tableId = this.table.id
        const rowId = this.row.id
        await this.$store.dispatch('row_comments/fetchNextSetOfComments', {
          tableId,
          rowId,
        })
      } catch (e) {
        notifyIf(e, 'application')
      }
    },
    getKey(c) {
      if (c.params?.new_row_values) {
        return Object.keys(c.params.new_row_values)[0]
      } else {
        return ''
      }
    },
  },
}
</script>
