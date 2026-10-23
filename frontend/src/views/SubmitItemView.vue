<template>
  <div class="submit-page">
    <header class="page-header">
      <h1 class="page-header__title">{{ messages.submit.title }}</h1>
      <p class="page-header__subtitle">{{ messages.submit.subtitle }}</p>
    </header>

    <div class="submit-page__layout">
      <el-card shadow="never">
        <el-alert
          v-if="formError"
          class="submit-page__alert"
          type="error"
          :title="formError"
          :closable="false"
          show-icon
        />

        <el-form label-position="top" @submit.native.prevent="submit">
          <el-form-item :label="messages.submit.titleLabel" for="item-title" :error="errors.title">
            <el-input
              id="item-title"
              ref="titleInput"
              v-model="form.title"
              :placeholder="messages.submit.titlePlaceholder"
              maxlength="120"
              show-word-limit
              @input="clearError('title')"
            />
          </el-form-item>

          <el-form-item :label="messages.submit.bodyLabel" for="item-body" :error="errors.body">
            <el-input
              id="item-body"
              v-model="form.body"
              type="textarea"
              :autosize="{ minRows: 8, maxRows: 16 }"
              :placeholder="messages.submit.bodyPlaceholder"
              maxlength="5000"
              show-word-limit
              @input="clearError('body')"
            />
          </el-form-item>

          <div class="submit-page__footer">
            <span class="submit-page__hint">{{ messages.submit.requiredHint }}</span>
            <el-button type="primary" native-type="submit" icon="el-icon-s-promotion" :loading="submitting">
              {{ messages.submit.submitButton }}
            </el-button>
          </div>
        </el-form>
      </el-card>

      <aside class="submit-page__aside">
        <h2 class="submit-page__aside-title">{{ messages.submit.nextStepsTitle }}</h2>
        <ol class="submit-page__steps">
          <li v-for="step in messages.submit.nextSteps" :key="step.title">
            <strong>{{ step.title }}</strong> {{ step.text }}
          </li>
        </ol>
      </aside>
    </div>
  </div>
</template>

<script>
import { createItem } from '../api/items'
import { MESSAGES } from '../constants/messages'

function emptyForm() {
  return { title: '', body: '' }
}

export default {
  name: 'SubmitItemView',

  data() {
    return {
      messages: MESSAGES,
      form: emptyForm(),
      errors: {},
      formError: '',
      submitting: false
    }
  },

  methods: {
    validate() {
      const errors = {}
      if (!this.form.title.trim()) errors.title = MESSAGES.submit.titleRequired
      if (!this.form.body.trim()) errors.body = MESSAGES.submit.bodyRequired
      this.errors = errors
      return Object.keys(errors).length === 0
    },

    clearError(field) {
      if (this.errors[field]) {
        this.errors = { ...this.errors, [field]: '' }
      }
    },

    async submit() {
      if (this.submitting || !this.validate()) return

      this.submitting = true
      this.formError = ''

      try {
        await createItem(this.form)
        this.form = emptyForm()
        this.$message.success(MESSAGES.submit.success)
        this.$refs.titleInput.focus()
      } catch (error) {
        if (error.status === 422) {
          this.errors = error.fieldErrors
        } else {
          this.formError = error.message
        }
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.submit-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: $space-6;

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: $space-5;
    align-items: start;
  }

  &__alert {
    margin-bottom: $space-4;
  }

  &__footer {
    display: flex;
    gap: $space-3;
    align-items: center;
    justify-content: space-between;
  }

  &__hint {
    font-size: $font-size-sm;
    color: $gray-500;
  }

  &__aside {
    padding: $space-5;
    background: #fff;
    border: 1px solid $gray-200;
    border-radius: $radius-lg;
  }

  &__aside-title {
    margin: 0 0 $space-3;
    font-size: $font-size-base;
    font-weight: 600;
  }

  &__steps {
    display: grid;
    gap: $space-3;
    margin: 0;
    padding-left: $space-5;
    font-size: $font-size-sm;
    color: $gray-500;

    strong {
      color: $gray-900;
    }
  }

  @media (max-width: $breakpoint-md) {
    padding: $space-4;

    &__layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
