<template>
  <div v-loading="loading" class="async-state">
    <div v-if="error" class="async-state__error">
      <el-alert type="error" :title="errorTitle" :description="error" :closable="false" show-icon />
      <el-button size="small" icon="el-icon-refresh" @click="$emit('retry')">{{ messages.common.retry }}</el-button>
    </div>

    <slot v-if="showEmpty" name="empty" />
    <slot v-else />
  </div>
</template>

<script>
import { MESSAGES } from '../constants/messages'

export default {
  name: 'AsyncState',

  props: {
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    errorTitle: { type: String, required: true },
    empty: { type: Boolean, default: false }
  },

  data() {
    return {
      messages: MESSAGES
    }
  },

  computed: {
    showEmpty() {
      return this.empty && !this.loading && !this.error
    }
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.async-state {
  min-height: 120px;

  &__error {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    align-items: flex-start;
    padding: $space-5;
  }
}
</style>
