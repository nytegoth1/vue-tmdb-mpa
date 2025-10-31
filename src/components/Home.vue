<template>
  <div class="main">
    <nav class="mobile-nav">
      <div class="nav-container">


        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-toggle" @click="toggleMenu" :aria-expanded="isMenuOpen">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>

        <!-- Navigation Links -->
        <div class="nav-menu" :class="{ 'is-active': isMenuOpen }">
          <ul class="nav-list">
            <li @click="goToHome">TMDB Movie Search</li>
            <li class="nav-item" @click="fetchMoviesByCategory(28); closeMenu();">Action

            </li>
            <li class="nav-item" @click="fetchMoviesByCategory(12); closeMenu()">Adventure

            </li>
            <li class="nav-item" @click="fetchMoviesByCategory(16); closeMenu()">Animation

            </li>

            <li class="nav-item" @click="fetchMoviesByCategory(35); closeMenu()">Comedy</li>

            <li class="nav-item" @click="fetchMoviesByCategory(80); closeMenu()">Crime</li>

            <li class="nav-item" @click="fetchMoviesByCategory(18); closeMenu()">Drama</li>

            <li class="nav-item" @click="fetchMoviesByCategory(878); closeMenu()">SCI-FI</li>
            <li class="nav-item" @click="fetchMoviesByCategory(53); closeMenu()">Thriller</li>
            <li class="nav-item" @click="fetchMoviesByCategory(27); closeMenu()">Horror</li>
          </ul>
        </div>
      </div>

      <!-- Overlay for mobile -->
      <div class="nav-overlay" :class="{ 'is-active': isMenuOpen }" @click="closeMenu"></div>
    </nav>

    <nav class="provider-nav">
      <div class="provider-container">
        <h3 class="provider-title"></h3>
        <div class="provider-list">
          <button v-for="provider in providers" :key="provider.provider_id"
            :class="['streaming-btn', { 'active': selectedProvider === provider.provider_id }]"
            @click="filterByProvider(provider.provider_id)" :title="provider.provider_name">

            <span class="provider-name">{{ provider.provider_name }}</span>
          </button>
          <button v-if="selectedProvider" class="provider-btn clear-btn" @click="clearProviderFilter">
            <span>✕ Clear</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Search Input -->
    <input name="search" class="search" v-model="searchQuery" @input="searchMovies" type="text"
      placeholder="Search for a movie..." />

    <div class="loading-indicator" v-if="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- Movies List -->
    <div class="main" v-if="movies.length">
      <div class="movie movie-card" v-for="movie in movies" :key="movie.id">
        <!-- <h3>{{ movie.title }}</h3> -->
        <router-link :to="'/moviedetails/' + movie.id">
          <img
            :src="movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : 'https://placehold.co/250x375?text=No+Image'"
            class="" alt="Movie Poster" />
        </router-link>
        <p><span class="release-date">{{ movie.formattedReleaseDate }}</span> <span class="star-rating"> {{
          movie.vote_average }}</span></p>
        <p></p>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="!loading && movies.length > 0" class="load-more">
      <button class="morebutton" @click="loadMoreMovies" :disabled="loading">
        {{ loading ? 'Loading...' : 'Load More' }}
      </button>
    </div>

    <!-- No Results Message -->
    <div v-if="!movies.length && !loading && !error">No results found</div>
  </div>
  <footer class="app-footer">
    <div class="container">
      <p>{{ new Date().getFullYear() }}</p>
    </div>
  </footer>
</template>


<script>
import axios from 'axios';
const apiKey = import.meta.env.VITE_APP_API_KEY;
export default {
  name: 'App',
  data() {
    return {
      movies: [], // Movies array to store results
      loading: false,
      error: null,
      searchQuery: '',
      currentPage: 1,
      searchPage: 1,
      selectedCategory: null,
      isMenuOpen: false,
      providers: [], // Store list of available providers
      selectedProvider: null, // Currently selected provider
    };
  },
  created() {
    // Load popular movies only if no category is stored
    const storedCategory = localStorage.getItem('selectedCategory');
    if (!storedCategory) {
      this.loadPopularMovies();
    }
    // Load available providers
    this.loadProviders();
  },
  mounted() {
    // Check for stored category in localStorage
    const storedCategory = localStorage.getItem('selectedCategory');
    const storedPage = localStorage.getItem('StoredPage');
    this.currentPage = storedPage ? parseInt(storedPage) : 1;
    if (storedCategory) {
      this.selectedCategory = storedCategory;
      this.fetchMoviesByCategory(storedCategory);
    }
  },
  methods: {
    // 

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
      if (this.isMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },
    closeMenu() {
      this.isMenuOpen = false;
      document.body.style.overflow = '';
    },

    async fetchMoviesByCategory(categoryId, append = false) {
      this.loading = true;
      if (!append) {
        this.searchQuery = '';
        window.scrollTo(0, 0);

        if (this.selectedCategory !== categoryId) {
          this.currentPage = 1;
          this.searchPage = 1;
          localStorage.setItem('StoredPage', this.currentPage);
        }
      }

      this.selectedCategory = categoryId;
      localStorage.setItem('selectedCategory', categoryId);

      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${categoryId}&page=${this.currentPage}`;

      try {
        const response = await axios.get(url);
        const movies = response.data.results;

        // For each movie, format the release date
        for (const movie of movies) {
          this.formatReleaseDate(movie);
        }

        if (append) {
          this.movies = [...this.movies, ...movies];
        } else {
          this.movies = movies;
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        this.loading = false;
      }
    },

    // Fetch popular movies
    async loadPopularMovies() {
      this.loading = true;
      this.selectedCategory = 'null';
      this.searchQuery = '';
      this.searchPage = 1;
      const storedPage = localStorage.getItem('StoredPage');
      this.currentPage = storedPage ? parseInt(storedPage) : 1;
      const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=${this.currentPage}`;

      try {
        const response = await axios.get(url);
        const movies = response.data.results;

        // For each movie, format the release date
        for (const movie of movies) {
          this.formatReleaseDate(movie);
        }

        this.movies = movies;
        this.loading = false;
      } catch (err) {
        this.error = 'Error fetching popular movies';
        this.loading = false;
      }
    },

    // Load available streaming providers
    async loadProviders() {
      try {
        const url = `https://api.themoviedb.org/3/watch/providers/movie?api_key=${apiKey}&language=en-US&watch_region=US`;
        const response = await axios.get(url);
        // Get top streaming providers (you can adjust this list)
        const popularProviders = [8, 9, 15, 337, 350, 386, 119, 1899, 2528]; // Netflix, Prime, Hulu, Disney+, Apple TV+, Peacock, HBO Max, Paramount+
        this.providers = response.data.results.filter(p => popularProviders.includes(p.provider_id));
      } catch (error) {
        console.error('Error loading providers:', error);
      }
    },

    // Filter movies by streaming provider
    async filterByProvider(providerId) {
      this.selectedProvider = providerId;
      this.selectedCategory = null;
      this.searchQuery = '';
      this.currentPage = 1;
      this.loading = true;
      window.scrollTo(0, 0);

      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_watch_providers=${providerId}&watch_region=US&page=${this.currentPage}`;

      try {
        const response = await axios.get(url);
        const movies = response.data.results;

        for (const movie of movies) {
          this.formatReleaseDate(movie);
        }

        this.movies = movies;
      } catch (error) {
        console.error('Error fetching movies by provider:', error);
        this.error = 'Error fetching movies';
      } finally {
        this.loading = false;
      }
    },

    // Clear provider filter
    clearProviderFilter() {
      this.selectedProvider = null;
      this.loadPopularMovies();
    },

    // Search for movies based on the query
    async searchMovies() {
      if (!this.searchQuery) {
        this.loadPopularMovies();
        return;
      }

      // Reset search page to 1 when starting a new search
      this.searchPage = 1;
      this.loading = true;
      this.error = null;

      // Search for movies using the TMDB API
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${this.searchQuery}&language=en-US&page=${this.searchPage}`;

      try {
        const response = await axios.get(url);
        const movies = response.data.results;

        // For each movie, format the release date
        for (const movie of movies) {
          this.formatReleaseDate(movie);
        }

        this.movies = movies;
        this.loading = false;
      } catch (err) {
        this.error = 'Error fetching search results';
        this.loading = false;
      }
    },

    // Format the release date to "DD/MM/YYYY"
    formatReleaseDate(movie) {
      if (movie.release_date) {
        const releaseDate = new Date(movie.release_date);
        const day = String(releaseDate.getDate()).padStart(2, '0');
        const month = String(releaseDate.getMonth() + 1).padStart(2, '0');
        const year = releaseDate.getFullYear();
        movie.formattedReleaseDate = `${month}/${day}/${year}`;
      }
    },

    async loadMoreMovies() {
      if (this.searchQuery) {
        this.searchPage += 1;
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${this.searchQuery}&language=en-US&page=${this.searchPage}`;
        try {
          this.loading = true;
          const response = await axios.get(url);
          const movies = response.data.results;

          for (const movie of movies) {
            this.formatReleaseDate(movie);
          }

          this.movies = [...this.movies, ...movies];
        } catch (err) {
          this.error = 'Error fetching more search results';
        } finally {
          this.loading = false;
        }
      } else if (this.selectedProvider) {
        // Load more movies from selected provider
        this.currentPage += 1;
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_watch_providers=${this.selectedProvider}&watch_region=US&page=${this.currentPage}`;
        try {
          this.loading = true;
          const response = await axios.get(url);
          const movies = response.data.results;

          for (const movie of movies) {
            this.formatReleaseDate(movie);
          }

          this.movies = [...this.movies, ...movies];
        } catch (err) {
          this.error = 'Error fetching more provider movies';
        } finally {
          this.loading = false;
        }
      } else {
        // If not in search mode, increment category or popular page
        this.currentPage += 1;
        localStorage.setItem('StoredPage', this.currentPage);

        if (this.selectedCategory && this.selectedCategory !== 'null') {
          await this.fetchMoviesByCategory(this.selectedCategory, true);
        } else {
          // For popular movies
          try {
            this.loading = true;
            const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=${this.currentPage}`;
            const response = await axios.get(url);
            const movies = response.data.results;

            // Format release dates
            for (const movie of movies) {
              this.formatReleaseDate(movie);
            }

            this.movies = [...this.movies, ...movies]; // Append new movies
          } catch (err) {
            this.error = 'Error fetching more movies';
          } finally {
            this.loading = false;
          }
        }
      }
    },

    // Go to home and load the first page of popular movies
    goToHome() {
      this.closeMenu();
      this.currentPage = 1;
      this.searchPage = 1;
      this.searchQuery = '';
      window.scrollTo(0, 0);
      localStorage.setItem('StoredPage', this.currentPage);
      localStorage.setItem('selectedCategory', '');
      this.loadPopularMovies();
    },
  },
};
</script>




<style scoped>
/* color palette from <https://github.com/vuejs/theme> */
:root {
  --vt-c-white: #ffffff;
  --vt-c-white-soft: #f8f8f8;
  --vt-c-white-mute: #f2f2f2;

  --vt-c-black: #181818;
  --vt-c-black-soft: #222222;
  --vt-c-black-mute: #282828;

  --vt-c-indigo: #2c3e50;

  --vt-c-divider-light-1: rgba(60, 60, 60, 0.29);
  --vt-c-divider-light-2: rgba(60, 60, 60, 0.12);
  --vt-c-divider-dark-1: rgba(84, 84, 84, 0.65);
  --vt-c-divider-dark-2: rgba(84, 84, 84, 0.48);

  --vt-c-text-light-1: var(--vt-c-indigo);
  --vt-c-text-light-2: rgba(60, 60, 60, 0.66);
  --vt-c-text-dark-1: var(--vt-c-white);
  --vt-c-text-dark-2: rgba(235, 235, 235, 0.64);
}

/* semantic color variables for this project */
:root {
  --color-background: var(--vt-c-white);
  --color-background-soft: var(--vt-c-white-soft);
  --color-background-mute: var(--vt-c-white-mute);

  --color-border: var(--vt-c-divider-light-2);
  --color-border-hover: var(--vt-c-divider-light-1);

  --color-heading: var(--vt-c-text-light-1);
  --color-text: var(--vt-c-text-light-1);

  --section-gap: 160px;
}

/* Provider Navigation Styles */
.provider-nav {
  width: 100%;
  padding: 15px 0;
  position: relative;
  top: 80px;
  z-index: 90;
}

.provider-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.provider-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #333;
}

.provider-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.provider-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.provider-btn:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.provider-btn.active {
  border-color: #007bff;
  background-color: #e7f3ff;
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.provider-logo-nav {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
}

.provider-name {
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.clear-btn {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
  font-weight: 600;
}

.clear-btn:hover {
  background-color: #c82333;
  border-color: #bd2130;
  transform: translateY(-2px);
}

.clear-btn span {
  font-size: 14px;
}

@media (max-width: 768px) {
  .provider-nav {
    top: 48px;
  }

  .provider-container {
    padding: 0 10px;
  }

  .provider-btn {
    min-width: 70px;
    padding: 6px 8px;
  }

  .provider-logo-nav {
    width: 35px;
    height: 35px;
  }

  .provider-name {
    font-size: 11px;
    max-width: 70px;
  }
}

ul.nav {
  margin: 0;
  width: 100% !important;
  left: 0px;
  top: 0px;
  position: fixed;
  overflow: hidden;
  height: auto;
  background-color: rgba(255, 255, 255, 1);
  -webkit-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  -moz-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  padding-right: 20px;
  z-index: 100;
}

ul.nav-list li {
  text-align: center;
  font-family: monospace;
  font-size: 22px;
  /* color: #333333; */
  color: #ffffff;
  height: 47.5px;
  padding-left: 20px;
  padding-right: 20px;
  cursor: pointer;
  padding-top: 17.5px !important;
  float: left;
  list-style: none;
  font-weight: 200;
  /* border-left: 1px solid rgba(0, 0, 0, .1); */
  border-left: 1px solid rgba(118, 75, 162, 0.2);
  background-color: none;
  transition: background-color ease-in-out .5s;
  -moz-transition: background-color ease-in-out .5s;
  -webkit-transition: background-color ease-in-out .5s;
  -o-transition: background-color ease-in-out .5s;
  /* text-shadow: 0px -3px 3px rgba(255, 255, 255, 0.2); */
}

ul.nav-list li a,
a:visited,
a:hover {
  color: #666666;
  text-decoration: none;
}

ul.nav-list li:first-child {
  font-weight: bold;
  border-left: none;
  padding-right: 8rem;
}

ul.nav-list li:hover {
  /* background-color: rgba(42, 42, 42, 0.2); */
  /* box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3); */
  /* border-color: #667eea; */
  filter: drop-shadow(0 2px 10px rgba(102, 126, 234, 1.0));
  /* x-offset y-offset blur-radius color */
}

ul.nav-list li.active {
  background-color: rgba(42, 42, 42, 0.2);
}

.error {
  color: red;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin: 10px 0;
}

input {
  padding: 10px;
  width: 100%;
  margin-bottom: 20px;
  font-size: 16px;
}

.actors {
  display: none;
}

section {
  position: absolute;
  bottom: 0;
  background: rgba(white, 0.9);
  padding: 20px;
  overflow: hidden;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  opacity: 0;
  transform: translate3d(0, 10%, 0);
  transition: opacity 350ms ease-in-out 150ms, transform 350ms ease-in-out 150ms;
}

/* Hover effect for movie overview */


.movie-overview {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2rem;
  color: #000;
  border-top: 1px solid #2f2f2f;
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  max-height: 100%;
  transform: translateY(101%);
  overflow-y: auto;
  transition: transform 0.3sease-in;
  transition: opacity 350ms ease-in-out 100ms, transform 350ms ease-in-out 100ms;
}

div:hover>.movie-overview {
  opacity: 1;
  color: #000;
  transform: translate(0, -85px);
}

#app {
  width: 98%;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

/* @media (hover: hover) {
  a:hover {
    background-color:rgba(42, 42, 42, 0.2);
  }
} */

@media (min-width: 1024px) {
  body {
    display: flex;
    place-items: center;
  }

  #app {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
}

#main {
  width: 100%;
}

.main {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.movie {
  width: 300px;
  margin: 1rem;
  background-color: var(--secondary-color);
  /* box-shadow: 0 4px 5px rgba(0, 0, 0, 0.2); */
  position: relative;
  overflow: hidden;
  border-radius: 3px;
  height: max-content;
}

.movie img {
  width: 100%;
}

body {
  min-height: 100vh;
  color: var(--color-text);
  /* background-color: #181818; */
  transition:
    color 0.5s,
    background-color 0.5s;
  line-height: 1.6;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    sans-serif;
  font-size: 15px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.load-more {
  text-align: center;
  margin: 20px 0;
  width: 100%;
  display: flex;
}

.morebutton {
  padding: 10px 20px;
  background: linear-gradient(to bottom, #1a1f3a 0%, #0f1329 100%);
  color: #b8bdd0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  border: 1px solid #2d3454;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 50%;
  margin: 0 auto;
}

.morebutton:hover {
  background: linear-gradient(to bottom, #252a4a 0%, #1a1f3a 100%);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

ul.nav {
  margin: 0;
  width: 100% !important;
  left: 0px;
  top: 0px;
  position: fixed;
  overflow: hidden;
  height: auto;
  background-color: rgba(255, 255, 255, 1);
  -webkit-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  -moz-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  padding-right: 20px;
  z-index: 100;
}

ul.nav li {
  text-align: center;
  font-family: monospace;
  font-size: 22px;
  color: #333333;
  height: 47.5px;
  padding-left: 20px;
  padding-right: 20px;
  cursor: pointer;
  padding-top: 17.5px !important;
  float: left;
  list-style: none;
  font-weight: 200;
  border-left: 1px solid rgba(0, 0, 0, .1);
  background-color: none;
  transition: background-color ease-in-out .5s;
  -moz-transition: background-color ease-in-out .5s;
  -webkit-transition: background-color ease-in-out .5s;
  -o-transition: background-color ease-in-out .5s;
  text-shadow: 0px -3px 3px rgba(255, 255, 255, 0.2);
}

ul.nav li a,
a:visited,
a:hover {
  color: #666666;
  text-decoration: none;
}

ul.nav li:first-child {
  font-weight: bold;
  border-left: none;
  padding-right: 8rem;
}

ul.nav li:first-child:hover {
  background-color: rgba(42, 42, 42, 0.0);
}

ul.nav li:hover {
  background-color: rgba(42, 42, 42, 0.2);
}

ul.nav li.active {
  background-color: rgba(42, 42, 42, 0.2);
}

@media screen and (max-width: 600px) {
  .mnav {
    display: none;
  }
}

.search {
  margin-top: 85px;
  flex: 1;
  padding: 12px 20px;
  font-size: 16px;
  border: 1px solid #2d3454;
  /* border-radius: 25px; */
  outline: none;
  transition: all 0.3s;
  background: #0f1329;
  color: #ffffff;
}

input:focus-visible {
  outline: none;
}


.loading-indicator {
  width: 100%;
  gap: 4px;
  padding: 8px 0;
  text-align: center;
}

.loading-indicator span {
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1.0);
  }
}



.mobile-nav {
  margin: 0;
  width: 100% !important;
  left: 0px;
  top: 0px;
  position: fixed;
  overflow: hidden;
  height: auto;
  /* background-color: rgba(255, 255, 255, 1); */
  background: linear-gradient(to bottom, #1a1f3a 0%, #0f1329 100%);
  -webkit-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  -moz-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  padding-right: 20px;
  z-index: 100;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.nav-brand {
  z-index: 1001;
}

.brand-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffb400;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Hamburger Menu Button */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background-color: #000;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* Navigation Menu */
.nav-menu {
  display: flex;
  align-items: center;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.5rem;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #000;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 1rem;
  white-space: nowrap;
}

.nav-link.router-link-active {
  background-color: rgba(255, 180, 0, 0.2);
  color: #ffb400;
}

.nav-icon {
  font-size: 1.2rem;
}

/* Overlay */
.nav-overlay {
  display: none;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: flex;
  }

  .nav-menu {
    position: fixed;
    top: 0;
    right: -100%;
    height: 100vh;
    width: 280px;
    background-color: #1a1f3a;
    flex-direction: column;
    padding-top: 80px;
    transition: right 0.3s ease;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
    z-index: 101;
  }

  .nav-menu.is-active {
    right: 0;
  }

  .nav-list {
    flex-direction: column;
    width: 100%;
    gap: 0;
    overflow-y: auto;
    overflow-x: hidden;
    margin-bottom: 120PX;
  }

  .nav-item {
    width: 100%;
    border-bottom: 1px solid #333;
  }

  .nav-item a {
    display: block;
    width: 100%;
    min-height: 48px;
    /* Better touch target */
    display: flex;
    align-items: center;
  }

  .nav-link {
    width: 100%;
    padding: 1.25rem 1.5rem;
    border-radius: 0;
    font-size: 1.1rem;
  }

  .nav-icon {
    font-size: 1.4rem;
  }

  .nav-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    z-index: 99;
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3);
    border-color: #667eea;
  }

  .nav-overlay.is-active {
    opacity: 1;
    visibility: visible;
  }
}

/* Tablet Styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .nav-list {
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.6rem 0.8rem;
    font-size: 0.95rem;
  }

  .nav-icon {
    font-size: 1.1rem;
  }
}

/* Medium Mobile Styles */
@media (max-width: 768px) {
  .ollama-chat-container {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    height: 70vh;
    border-radius: 8px 8px 0 0;
    z-index: 10000;
  }

  .search {
    margin-top: 48px;
  }

  .movie-poster {
    flex: 1 1 100%;
  }

  .movie-img {
    width: 100%;
    max-width: 380px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .nav-container {
    padding: 0.75rem;
  }

  .trailer-iframe {
    width: 100%;
  }

  .movie-content {
    flex-direction: column;
    align-items: center;
  }

  .movie-container {
    margin-top: -60px;
  }

  .movie-data {
    max-width: 100%;
    margin-top: 0px;
    padding: 0 1rem;
  }

  .movie-title {
    font-size: 1.5rem;
  }

  .ollama-chat-container {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    border-radius: 0;
    z-index: 10000;
  }

  .ollama-chat-messages {
    padding: 12px;
  }

  .ollama-chat-input {
    padding: 10px;
  }

  .ollama-chat-input textarea {
    font-size: 16px;
    /* Prevents zoom on iOS */
  }

  .brand-text {
    font-size: 1.25rem;
  }

  .nav-menu {
    width: 100%;
    right: -100%;
  }

  .nav-menu.is-active {
    right: 0;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {

  .nav-menu,
  .nav-overlay,
  .hamburger-line,
  .nav-link {
    transition: none;
  }
}

footer.app-footer {
  color: #fff;
  text-align: center;
  padding: 1rem 0;
  width: 100%;
}

.movie-card {
  background: #0f1329;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid #2d3454;
  text-align: center;
}

.movie-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.streaming-btn {
  padding: 12px 24px;
  font-size: 0.95rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  background: linear-gradient(to bottom, #1a1f3a 0%, #0f1329 100%);
  color: #b8bdd0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  border: 1px solid #2d3454;
}

.streaming-btn:hover {
  background: linear-gradient(to bottom, #252a4a 0%, #1a1f3a 100%);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

.star-rating:before {
  content: "★";
  /* Unicode star character */
  color: gold;
}

.release-date {
  font-size: 0.9rem;
  color: #ccc;
  margin-right: 12px;
}
</style>
