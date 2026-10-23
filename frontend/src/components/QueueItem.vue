<template>
  <article class="queue-item" :class="{ 'queue-item--selected': selected }">
    <div class="queue-item__top">
      <h2 class="queue-item__title">{{ item.title }}</h2>
      <el-tooltip :content="submittedAt" placement="top" :open-delay="300">
        <time class="queue-item__time" :datetime="item.created_at">{{ submittedAgo }}</time>
      </el-tooltip>
    </div>
    <p class="queue-item__excerpt">{{ item.excerpt }}</p>
    <div class="queue-item__meta">
      <status-tag :status="item.status" />
      <el-tag v-for="flag in item.flags" :key="flag.code" type="danger" size="small" effect="plain" disable-transitions>
        <i class="el-icon-warning-outline" /> {{ flag.label }}
      </el-tag>
    </div>
  </article>
</template>

<script>
import { formatDateTime, formatRelative } from '../formatDate'
import StatusTag from './StatusTag.vue'

export default {
  name: 'QueueItem',

  components: { StatusTag },

  props: {
    item: { type: Object, required: true },
    selected: { type: Boolean, default: false }
  },

  computed: {
    submittedAt() {
      return formatDateTime(this.item.created_at)
    },

    submittedAgo() {
      return formatRelative(this.item.created_at)
    }
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.queue-item {
  padding: $space-4 $space-5;
  border-left: 3px solid transparent;

  &--selected {
    background: $color-primary-soft;
    border-left-color: $color-primary;
  }

  &__top {
    display: flex;
    gap: $space-3;
    align-items: baseline;
  }

  &__title {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: $font-size-base;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__time {
    flex-shrink: 0;
    font-size: $font-size-xs;
    color: $gray-500;
  }

  &__excerpt {
    display: -webkit-box;
    margin: $space-1 0 $space-2;
    overflow: hidden;
    font-size: $font-size-sm;
    color: $gray-500;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__meta {
    display: flex;
    gap: $space-2;
    align-items: center;
  }
}
</style>
