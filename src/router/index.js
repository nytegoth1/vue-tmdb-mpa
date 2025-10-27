import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue';
import Bio from '../components/Bio.vue';
import UserDetails from '../components/UserDetails.vue';

// Define routes
const routes = [
  { path: '/', component: Home },
    {
    path: '/actor/:id', // Using ID as the primary parameter
    name: 'bio',
    component: Bio,
    props: true // This passes the route params as props to the component
  },
  { path: '/moviedetails/:id', component: UserDetails, props: true }, // Dynamic route for user details
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    window.scrollTo(0,0);
  }
});

export default router;
