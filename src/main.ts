import { createApp } from 'vue';
import App from './App.vue';  // Correct import of App.vue component
import router from './router';  // Import the Vue Router

// Create the Vue app and use the router, then mount it to the DOM
createApp(App)
  .use(router)
  .mount('#app');