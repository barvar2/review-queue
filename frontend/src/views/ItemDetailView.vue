<template>
  <article class="item-detail">
    <async-state
      class="item-detail__state"
      :loading="loading"
      :error="error"
      :error-title="messages.item.loadError"
      @retry="loadItem"
    >
      <template v-if="item">
        <div class="item-detail__content">
          <router-link class="item-detail__back" :to="queueLink">
            <i class="el-icon-arrow-left" /> {{ messages.item.backToQueue }}
          </router-link>

          <header>
            <div class="item-detail__meta">
              <span>#{{ item.id }}</span>
              <span aria-hidden="true">·</span>
              <el-tooltip :content="submittedAt" placement="top" :open-delay="300">
                <span>{{ messages.item.submittedAgo(submittedAgo) }}</span>
              </el-tooltip>
              <status-tag :status="item.status" />
            </div>
            <h2 ref="heading" class="item-detail__title" tabindex="-1">{{ item.title }}</h2>
          </header>

          <p class="item-detail__body">{{ item.body }}</p>

          <el-card shadow="never" class="item-detail__flags">
            <div class="item-detail__label"><i class="el-icon-warning-outline" /> {{ messages.item.flagsTitle }}</div>
            <ul v-if="item.flags.length" class="item-detail__flag-list">
              <li v-for="flag in item.flags" :key="flag.code">
                <el-tag type="danger" size="small" effect="plain" disable-transitions>{{ flag.label }}</el-tag>
                <span>{{ flag.reason }}</span>
              </li>
            </ul>
            <p v-else class="item-detail__muted">{{ messages.item.noFlags }}</p>
            <p class="item-detail__hint">{{ messages.item.flagsHint }}</p>
          </el-card>
        </div>

        <footer class="item-detail__actions">
          <el-alert
            v-if="conflict"
            class="item-detail__conflict"
            type="warning"
            :title="conflict.title"
            :description="conflict.description"
            :closable="false"
            show-icon
          />

          <review-form
            v-if="isPending"
            :submitting="submitting"
            :error="reviewError"
            @submit="submitReview"
          />

          <el-descriptions v-else class="item-detail__decision" :title="messages.item.decisionTitle" :column="1" :colon="false" size="small">
            <el-descriptions-item :label="messages.item.statusLabel"><status-tag :status="item.status" /></el-descriptions-item>
            <el-descriptions-item :label="messages.item.reviewedLabel">{{ reviewedAt }}</el-descriptions-item>
            <el-descriptions-item :label="messages.item.noteLabel">{{ item.review_note || messages.item.noNote }}</el-descriptions-item>
          </el-descriptions>
        </footer>
      </template>
    </async-state>
  </article>
</template>

<script>
import { fetchItem, reviewItem } from '../api/items'
import { MESSAGES } from '../constants/messages'
import { formatDateTime, formatRelative } from '../formatDate'
import AsyncState from '../components/AsyncState.vue'
import ReviewForm from '../components/ReviewForm.vue'
import StatusTag from '../components/StatusTag.vue'

function conflictFor(item, unsavedNote) {
  const note = unsavedNote.trim()
  const description = note ? MESSAGES.review.conflictWithNote(note) : MESSAGES.review.conflictWithoutNote

  return { title: MESSAGES.review.conflictTitle(item.status), description }
}

export default {
  name: 'ItemDetailView',

  components: { AsyncState, ReviewForm, StatusTag },

  props: {
    id: { type: Number, required: true }
  },

  data() {
    return {
      messages: MESSAGES,
      item: null,
      loading: false,
      error: '',
      submitting: false,
      reviewError: '',
      conflict: null,
      loadVersion: 0
    }
  },

  computed: {
    isPending() {
      return this.item !== null && this.item.status === 'pending'
    },

    submittedAt() {
      return formatDateTime(this.item.created_at)
    },

    submittedAgo() {
      return formatRelative(this.item.created_at)
    },

    reviewedAt() {
      return formatDateTime(this.item.reviewed_at)
    },

    queueLink() {
      return { name: 'queue', query: this.$route.query }
    }
  },

  watch: {
    id: {
      immediate: true,
      handler() {
        this.loadItem()
      }
    }
  },

  methods: {
    async loadItem() {
      const version = ++this.loadVersion
      this.item = null
      this.loading = true
      this.error = ''
      this.submitting = false
      this.reviewError = ''
      this.conflict = null

      try {
        const item = await fetchItem(this.id)
        if (version !== this.loadVersion) return
        this.item = item
        this.$emit('item-changed', item)
        this.$nextTick(() => this.$refs.heading && this.$refs.heading.focus({ preventScroll: true }))
      } catch (error) {
        if (version === this.loadVersion) this.error = error.status === 404 ? MESSAGES.errors.itemNotFound : error.message
      } finally {
        if (version === this.loadVersion) this.loading = false
      }
    },

    async submitReview({ decision, note }) {
      if (this.submitting || !this.isPending) return

      const version = this.loadVersion
      this.submitting = true
      this.reviewError = ''
      this.conflict = null

      try {
        const reviewed = await reviewItem(this.item.id, { decision, note })

        if (version !== this.loadVersion) {
          this.$emit('item-changed', reviewed)
          return
        }

        this.item = reviewed
        this.$message.success(decision === 'approve' ? MESSAGES.review.approved : MESSAGES.review.rejected)
        this.$emit('reviewed', reviewed)
      } catch (error) {
        const isConflict = error.status === 409 && error.data

        if (isConflict) this.$emit('item-changed', error.data)
        if (version !== this.loadVersion) return

        if (isConflict) {
          this.item = error.data
          this.conflict = conflictFor(error.data, note)
        } else {
          this.reviewError = error.message
        }
      } finally {
        if (version === this.loadVersion) this.submitting = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.item-detail {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;

  &__state {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
  }

  &__content {
    flex: 1 1 auto;
    min-height: 0;
    padding: $space-6;
    overflow-y: auto;
  }

  &__back {
    display: none;
    margin-bottom: $space-3;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    align-items: center;
    font-size: $font-size-sm;
    color: $gray-500;
  }

  &__title {
    margin: $space-2 0 0;
    font-size: $font-size-xl;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: anywhere;

    &:focus {
      outline: none;
    }
  }

  &__body {
    max-width: 70ch;
    margin: $space-5 0 $space-6;
    font-size: 15px;
    line-height: 1.65;
    color: $gray-700;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  &__flags {
    max-width: 70ch;
    background: $gray-50;
  }

  &__label {
    margin-bottom: $space-2;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $gray-500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__flag-list {
    display: grid;
    gap: $space-2;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      flex-wrap: wrap;
      gap: $space-2;
      align-items: center;
      color: $gray-700;
    }
  }

  &__muted {
    margin: 0;
    color: $gray-700;
  }

  &__hint {
    margin: $space-3 0 0;
    font-size: $font-size-xs;
    color: $gray-500;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-4 $space-6;
    background: #fff;
    border-top: 1px solid $gray-200;
  }

  @media (max-width: $breakpoint-md) {
    &__content {
      padding: $space-4;
      overflow: visible;
    }

    &__back {
      display: inline-block;
    }

    &__actions {
      position: sticky;
      bottom: 0;
      padding: $space-3 $space-4;
      border-radius: 0 0 $radius-lg $radius-lg;
      box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.06);
    }
  }
}
</style>
