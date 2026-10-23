<template>
  <el-tag :type="tag.type" size="small" effect="light" disable-transitions class="status-tag">
    <span class="status-tag__dot" />{{ tag.label }}
  </el-tag>
</template>

<script>
import { MESSAGES } from '../constants/messages'

const STATUS_TAGS = {
  pending: { type: 'warning', label: MESSAGES.status.pending },
  approved: { type: 'success', label: MESSAGES.status.approved },
  rejected: { type: 'danger', label: MESSAGES.status.rejected }
}

export default {
  name: 'StatusTag',

  props: {
    status: { type: String, required: true }
  },

  computed: {
    tag() {
      return STATUS_TAGS[this.status]
    }
  }
}
</script>

<style scoped lang="scss">
.status-tag {
  font-weight: 500;
  border: 0;

  &__dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 6px;
    vertical-align: 1px;
    border-radius: 50%;
    background: currentColor;
  }
}
</style>
