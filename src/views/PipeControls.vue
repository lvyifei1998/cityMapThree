<template>
  <div class="top-controls">
    <button :class="{ active: mode === 'select' }" @click="setMode('select')">鼠标选取</button>
    <button :class="{ active: mode === 'cut' }" @click="setMode('cut')">管线切割</button>
    <button @click="reset">重置视图</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['updateMode', 'reset']);
const mode = ref('select');

const setMode = (m: string) => {
  mode.value = m;
  emit('updateMode', m);
};
const reset = () => emit('reset');
</script>

<style scoped>
.top-controls {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 8px;
}

button {
  padding: 8px 15px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}

button.active {
  background: #00ffcc;
  color: #000;
}
</style>
