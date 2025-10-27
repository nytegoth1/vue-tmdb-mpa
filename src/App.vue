<template>
  <div id="app">
    <router-view></router-view>  <!-- Render the active route component -->
  </div>
</template>

<script>
export default {
  name: 'App',  // Ensure the name is correct
};
</script>

<style>
body {
  margin: 0 !important;
  padding: 0 !important;
  background-color: #181818;
  color: #ffffff;
}
</style>

