<template>
  <div class="review-form">
    <div class="review-form__field">
      <label for="review-note" class="visually-hidden">{{ messages.review.noteLabel }}</label>
      <el-input
        id="review-note"
        v-model="note"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 6 }"
        :placeholder="messages.review.notePlaceholder"
        maxlength="1000"
        show-word-limit
        :disabled="submitting"
      />
    </div>

    <el-alert v-if="error" class="review-form__error" type="error" :title="error" :closable="false" show-icon />

    <div class="review-form__actions">
      <el-button
        type="danger"
        plain
        icon="el-icon-close"
        :loading="submitting && decision === 'reject'"
        :disabled="submitting"
        @click="submit('reject')"
      >
        {{ messages.review.reject }}
      </el-button>
      <el-button
        type="success"
        icon="el-icon-check"
        :loading="submitting && decision === 'approve'"
        :disabled="submitting"
        @click="submit('approve')"
      >
        {{ messages.review.approve }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { MESSAGES } from '../constants/messages'

export default {
  name: 'ReviewForm',

  props: {
    submitting: { type: Boolean, default: false },
    error: { type: String, default: '' }
  },

  data() {
    return {
      messages: MESSAGES,
      note: '',
      decision: null
    }
  },

  methods: {
    submit(decision) {
      this.decision = decision
      this.$emit('submit', { decision, note: this.note })
    }
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.review-form {
  &__field {
    margin-bottom: $space-3;
  }

  &__error {
    margin-bottom: $space-3;
  }

  &__actions {
    display: flex;
    gap: $space-2;
    justify-content: flex-end;
  }

  @media (max-width: $breakpoint-md) {
    &__actions .el-button {
      flex: 1;
    }
  }
}
</style>
