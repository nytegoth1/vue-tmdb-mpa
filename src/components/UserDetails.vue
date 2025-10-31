<template>

  <div class="movie-container" :id="$attrs.id">

    <div v-if="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- Movies List -->

    <div class="main movie-inner" v-if="movies.length">
      <div class="movie-content" v-for="movie in movies" :key="movie.id">
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
                  <li><router-link to="/" class="nostyle" @click="closeMenu">TMDB Movie Search</router-link></li>
                  <li class="nav-item">
                    <span v-if="isFavorite(movie.id)"><a class="nostyle fav"
                        @click.prevent="handleToggleFavorite(movie)">Favorited ★</a></span><span v-else><a
                        class="nostyle" @click.prevent="handleToggleFavorite(movie)">Favorites ★</a></span>
                  </li>
                  <li class="nav-item">
                    <a class="nostyle" @click.prevent="handleOpenFavorites">View Favorites</a>
                  </li>
                  <li class="nav-item">
                    <a class="nostyle" @click.prevent="handleToggleChat">Ollama Chat <span
                        v-if="showOllamaChat">▲</span><span v-else>▼</span></a>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Overlay for mobile -->
            <div class="nav-overlay" :class="{ 'is-active': isMenuOpen }" @click="closeMenu"></div>
          </nav>
        </div>

        <div class="movie-poster">
          <img class="movie-img"
            :src="movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : 'https://placehold.co/250x375?text=No+Image'"
            alt="Movie Poster" />
        </div>

        <div class="movie-data">
          <h3 class="movie-title">{{ movie.title }}</h3>
          <div class="movie-overview movie-rating"> {{ movie.certification || 'NA' }}</div>
          <span>&nbsp; {{ movie.formattedReleaseDate }} &nbsp;</span>
          <span> {{ formatGenres(movie.genres) }}</span>
          <span> &nbsp; | &nbsp; </span>
          <span> {{ formatRuntime(movie.runtime) }} </span>
          <span> &nbsp; | &nbsp; {{ formatProductionCompanies(movie.production_companies) }} </span>
          <div class="movie-overview">{{ movie.overview }}</div>

          <!-- Trailer Section -->
          <div class="movie-overview" v-if="trailer">
            <button class="modalButton" @click="openModal">Watch Trailer</button>
          </div>
          <div class="movie-overview" v-else>
            <p>No trailer available.</p>
          </div>

          <div class="movie-overview" v-if="movie.providers && movie.providers.length > 0">
            <h4>Now Streaming On:</h4>
          </div>

          <div v-if="movie.providers && movie.providers.length > 0" class="provider-section">
            <div v-for="provider in movie.providers.slice(0, 3)" :key="provider.name" class="provider-item">
              <img :src="provider.logo" :alt="provider.name" class="provider-logo" />
              <!-- <span class="provider-type">{{ provider.type }}</span> -->
            </div>
          </div>

        </div>
      </div>
    </div>
    <!--- https://api.themoviedb.org/3/person/{person_id} -->
    <div class="movieChar" v-if="movies.length" v-for="movie in movies" :key="movie.id">
      <h4 class="movie-fields">Cast</h4>
      <div class="actorsz" v-if="movie.credits && movie.credits.cast.length > 0">
        <div class="movie-card" v-for="actor in getTopCast(movie.credits.cast)" :key="actor.id">
          <div class="movie-tags">{{ actor.name }}</div>
          <img
            :src="actor.profile_path ? 'https://image.tmdb.org/t/p/w500' + actor.profile_path : 'https://placehold.co/250x375?text=No+Image'"
            :alt="actor.name" class="actor-image" @click="viewActorBio(actor)" />

          <div class="movie-tags">as {{ actor.character }}</div>
          <br>
          <br>
        </div>
      </div>
    </div>

  </div>

  <!-- Modal -->
  <div v-if="isModalOpen" class="modal">
    <div class="modal-content">
      <span class="close" @click="closeModal">&times;</span>
      <iframe class="trailer-iframe" :src="'https://www.youtube.com/embed/' + trailer.key" width="760" height="515"
        frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>
  </div>

  <!-- No Results Message -->
  <div v-if="!movies.length && !loading && !error">No results found</div>


  <!-- Ollama Chat UI -->
  <div class="ollama-chat-container" v-if="showOllamaChat">
    <div class="ollama-chat-header">
      <h3>TMDB Movie Assistant</h3>
      <button class="close-button" @click="toggleOllamaChat">&times;</button>
    </div>
    <div class="ollama-chat-messages" ref="chatMessages">
      <div v-for="(message, index) in chatMessages" :key="index" :class="['message', message.role]">
        <div class="message-content">{{ message.content }}</div>
      </div>
      <div v-if="isLoading" class="message assistant">
        <div class="loading-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    <div class="ollama-chat-input">
      <textarea v-model="userMessage" @keyup.enter.exact="sendMessage" placeholder="Ask about the movie or actors..."
        rows="2"></textarea>
      <button class="send-button" @click="sendMessage" :disabled="isLoading || !userMessage.trim()">
        Send
      </button>
    </div>
  </div>

  <FavoritesModal :show="showFavoritesModal" :favorite-ids="favorites" @close="closeFavoritesModal"
    @remove-favorite="removeFromFavorites" @movie-selected="handleMovieSelection" />
</template>

<script>
import axios from 'axios';
import FavoritesModal from './FavoritesModal.vue';
const apiKey = import.meta.env.VITE_APP_API_KEY;

export default {
  name: 'App',
  data() {
    return {
      movies: [], // Movies array to store results
      loading: false,
      error: null,
      searchQuery: '', // Bound to the search input
      trailer: null, // Store the trailer data
      isModalOpen: false, // Modal state
      favorites: this.getStoredFavorites(), // Store favorite movie IDs
      showFavoritesModal: false,
      showOllamaChat: false,
      isMenuOpen: false,
      chatMessages: [
        { role: 'assistant', content: 'Hello! I\'m your TMDB movie assistant. Ask me anything about the current movie or actors!' }
      ],
      userMessage: '',
      isLoading: false
    };
  },
  components: {
    FavoritesModal
  },
  created() {
    // Load popular movies when the app is created
    this.loadPopularMovies();
  },
  methods: {

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

    handleToggleFavorite(movie) {
      this.closeMenu();
      this.toggleFavorite(movie);
    },

    handleOpenFavorites() {
      this.closeMenu();
      this.openFavoritesModal();
    },

    handleToggleChat() {
      this.closeMenu();
      this.toggleOllamaChat();
    },

    toggleOllamaChat() {
      this.showOllamaChat = !this.showOllamaChat;
      if (this.showOllamaChat && this.movies.length > 0) {
        // Add movie context when opening chat
        const movie = this.movies[0];
        const movieContext = `Currently viewing: ${movie.title} (${movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'})`;
        this.chatMessages = [
          { role: 'assistant', content: 'Hello! I\'m your TMDB movie assistant. Ask me anything about the current movie or actors!' },
          { role: 'system', content: movieContext }
        ];
      }
    },

    async sendMessage() {
      if (!this.userMessage.trim() || this.isLoading) return;

      // Add user message to chat
      this.chatMessages.push({ role: 'user', content: this.userMessage });
      const userQuery = this.userMessage;
      this.userMessage = '';
      this.isLoading = true;

      // Scroll to bottom of chat
      this.$nextTick(() => {
        if (this.$refs.chatMessages) {
          this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
        }
      });

      try {
        // Prepare movie context
        let context = '';
        if (this.movies.length > 0) {
          const movie = this.movies[0];
          context = `Movie: ${movie.title}\n`;
          context += `Release Date: ${movie.release_date || 'Unknown'}\n`;
          context += `Overview: ${movie.overview || 'No overview available'}\n`;

          // Add cast information if available
          if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {
            context += 'Cast: ' + movie.credits.cast.slice(0, 5).map(actor =>
              `${actor.name} as ${actor.character}`
            ).join(', ') + '\n';
          }
        }

        // Call Ollama API
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.2',
            messages: [
              {
                role: 'system',
                content: `You are a helpful movie assistant that knows about TMDB movies. 
                         Here is information about the current movie: ${context}`
              },
              {
                role: 'user',
                content: userQuery
              }
            ],
            stream: false
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to connect to Ollama API');
        }

        const data = await response.json();
        // Add assistant response to chat
        this.chatMessages.push({
          role: 'assistant',
          content: data.message?.content || 'Sorry, I couldn\'t process your request.'
        });

      } catch (error) {
        console.error('Ollama API error:', error);
        this.chatMessages.push({
          role: 'assistant',
          content: 'Sorry, there was an error connecting to the AI assistant. Make sure Ollama is running locally.'
        });
      } finally {
        this.isLoading = false;
        // Scroll to bottom of chat
        this.$nextTick(() => {
          if (this.$refs.chatMessages) {
            this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
          }
        });
      }
    },

    openFavoritesModal() {
      this.showFavoritesModal = true
    },

    closeFavoritesModal() {
      this.showFavoritesModal = false
    },

    removeFromFavorites(movieId) {
      this.favorites = this.favorites.filter(id => id !== movieId)
      localStorage.setItem('favorites', JSON.stringify(this.favorites))
    },

    // Add to Favorites Feature
    toggleFavorite(movie) {
      const id = movie.id;
      if (this.isFavorite(id)) {
        this.favorites = this.favorites.filter(favId => favId !== id);
      } else {
        this.favorites.push(id);
      }
      localStorage.setItem('favorites', JSON.stringify(this.favorites));
    },
    isFavorite(id) {
      return this.favorites.includes(id);
    },
    getStoredFavorites() {
      try {
        const favs = localStorage.getItem('favorites');
        return favs ? JSON.parse(favs) : [];
      } catch {
        return [];
      }
    },
    // Fetch popular movies
    async loadPopularMovies() {
      const movieId = this.$route.params.id;
      this.loading = true;
      const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;

      try {
        const response = await axios.get(url);
        const movies = [response.data];

        // For each movie, fetch the credits (top-billed cast), trailers, and providers
        for (const movie of movies) {
          await this.loadCredits(movie);
          await this.loadTrailer(movie); // Fetch trailer data here
          this.formatReleaseDate(movie);
          await this.loadProviders(movie); // Fetch providers data here

          const production_company = movie.production_companies.length > 0 ? movie.production_companies[0].name : 'Unknown';
          movie.production_companies = production_company;

          const genreNames = movie.genres.map(genre => genre.name).join(', ');
          movie.genres = genreNames;

          // Fetch movie certifications
          const certificationResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${apiKey}`);
          const certificationData = certificationResponse.data;
          // Extract certification for the US (or your target country)
          const usCertification = certificationData.results.find(release => release.iso_3166_1 === 'US');
          if (usCertification && usCertification.release_dates.length > 0) {
            movie.certification = usCertification.release_dates[0].certification;
          } else {
            movie.certification = 'NA';
          }
        }

        this.movies = movies;
        this.loading = false;
      } catch (err) {
        this.error = 'Error fetching popular movies';
        this.loading = false;
      }
    },

    // Fetch trailer data for a specific movie
    async loadTrailer(movie) {
      const url = `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${apiKey}&language=en-US`;

      try {
        const response = await axios.get(url);
        const trailer = response.data.results.find(video => video.site === 'YouTube' && video.type === 'Trailer');

        if (trailer) {
          this.trailer = trailer; // Store trailer information
        }
      } catch (err) {
        console.error(`Error fetching trailer for movie ${movie.title}:`, err);
      }
    },

    // Fetch providers data for a specific movie
    async loadProviders(movie) {
      if (!movie) return;

      const url = `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${apiKey}`;

      try {
        const response = await axios.get(url);
        const usProviders = response.data.results?.US;

        if (usProviders) {
          movie.providers = [];

          // Add all available provider types
          if (usProviders.flatrate) {
            usProviders.flatrate.forEach(provider => {
              movie.providers.push({
                name: provider.provider_name,
                logo: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : '',
                type: 'Streaming'
              });
            });
          }

          // if (usProviders.rent) {
          //   usProviders.rent.forEach(provider => {
          //     movie.providers.push({
          //       name: provider.provider_name,
          //       logo: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : '',
          //       type: 'Rent'
          //     });
          //   });
          // }

          // if (usProviders.buy) {
          //   usProviders.buy.forEach(provider => {
          //     movie.providers.push({
          //       name: provider.provider_name,
          //       logo: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : '',
          //       type: 'Buy'
          //     });
          //   });
          // }
        } else {
          movie.providers = [];
        }
      } catch (err) {
        console.error(`Error fetching providers for movie ${movie.title}:`, err);
        movie.providers = [];
      }
    },

    // Search for movies based on the query
    async searchMovies() {
      if (!this.searchQuery) {
        // If no search query, reload popular movies
        this.loadPopularMovies();
        return;
      }

      this.loading = true;
      this.error = null;

      // Search for movies using the TMDB API
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${this.searchQuery}&language=en-US&page=1`;

      try {
        const response = await axios.get(url);
        const movies = response.data.results;

        // For each movie, fetch the credits (top-billed cast), trailers, and providers
        for (const movie of movies) {
          await this.loadCredits(movie);
          await this.loadTrailer(movie); // Fetch trailer data here
          await this.loadProviders(movie); // Fetch providers data here

          // Fetch movie certifications
          const certificationResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${apiKey}`);
          const certificationData = certificationResponse.data;
          // Extract certification for the US (or your target country)
          const usCertification = certificationData.results.find(release => release.iso_3166_1 === 'US');
          if (usCertification && usCertification.release_dates.length > 0) {
            movie.certification = usCertification.release_dates[0].certification;
          } else {
            movie.certification = 'NA';
          }
        }

        this.movies = movies;
        this.loading = false;
      } catch (err) {
        this.error = 'Error fetching search results';
        this.loading = false;
      }
    },

    // Load credits for a specific movie
    async loadCredits(movie) {
      const url = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}&language=en-US`;

      try {
        const response = await axios.get(url);
        movie.credits = response.data; // Add credits to the movie object
      } catch (err) {
        console.error(`Error fetching credits for movie ${movie.title}:`, err);
      }
    },

    // Navigate to actor bio page
    viewActorBio(actor) {
      this.$router.push({
        name: 'bio',
        params: {
          id: actor.id.toString() // Only use params defined in the route path
        },
        query: {
          name: actor.name // Use query for additional data not in the route path
        }
      });
    },

    // Format the release date to "DD/MM/YYYY"
    formatReleaseDate(movie) {
      if (movie.release_date) {
        const releaseDate = new Date(movie.release_date);
        const day = String(releaseDate.getDate()).padStart(2, '0');
        const month = String(releaseDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = releaseDate.getFullYear();
        movie.formattedReleaseDate = `${month}/${day}/${year}`;
      }
    },

    // Format the release date to "DD/MM/YYYY"
    formatReleaseDate(movie) {
      if (movie.release_date) {
        const releaseDate = new Date(movie.release_date);
        const day = String(releaseDate.getDate()).padStart(2, '0');
        const month = String(releaseDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = releaseDate.getFullYear();
        movie.formattedReleaseDate = `${month}/${day}/${year}`;
      }
    },

    // Get the top-billed cast (limit the number of top actors, e.g., 5)
    getTopCast(cast) {
      //return cast.slice(0, 5); // Show only the first 5 actors
      return cast;
    },

    // Format runtime to hours and minutes
    formatRuntime(runtime) {
      if (runtime >= 60) {
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return `${hours}h ${minutes}m`;
      }
      return `${runtime}m`;
    },

    // Open modal
    openModal() {
      this.isModalOpen = true;
    },

    // Close modal
    closeModal() {
      this.isModalOpen = false;
    },

    // Navigate to home page
    goToHome() {
      this.currentPage = 1; // Reset the current page to 1
      this.searchPage = 1; // Reset the search page
      this.searchQuery = ''; // Reset the search query
      window.scrollTo(0, 0);
      localStorage.setItem('StoredPage', this.currentPage);
      localStorage.setItem('selectedCategory', ''); // Clear selected category in localStorage
      this.loadPopularMovies(); // Load popular movies
      window.location.href = 'http://localhost:5173/';
    },

    async handleMovieSelection(movieId) {
      // Reset component state
      this.movies = [];
      this.loading = true;
      this.error = null;

      try {
        // Fetch fresh movie data
        const movie = await this.fetchMovieDetails(movieId);
        if (movie) {
          // Format the movie data
          this.formatReleaseDate(movie);
          movie.genres = Array.isArray(movie.genres) ? movie.genres : [];
          movie.production_companies = Array.isArray(movie.production_companies) ? movie.production_companies : [];

          this.movies = [movie];

          // Load additional data
          await Promise.all([
            this.loadTrailer(movie),
            this.loadProviders(movie)
          ]);
        }
      } catch (error) {
        console.error('Error loading movie details:', error);
        this.error = 'Failed to load movie details';
      } finally {
        this.loading = false;
      }
    },

    async fetchMovieDetails(movieId) {
      const apiKey = import.meta.env.VITE_APP_API_KEY;
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`
        );
        if (!response.ok) throw new Error('Movie fetch failed');
        const movie = await response.json();
        // Initialize providers object
        movie.providers = { name: '', logo: '' };
        this.formatReleaseDate(movie);
        return movie;
      } catch (error) {
        console.error('Error fetching movie:', error);
        return null;
      }
    },

    formatGenres(genres) {
      if (!genres || !Array.isArray(genres)) return '';
      return genres.map(genre => genre.name).join(', ');
    },

    formatProductionCompanies(companies) {
      if (!companies || !Array.isArray(companies)) return '';
      return companies
        .slice(0, 2) // Only show first two companies
        .map(company => company.name)
        .join(', ');
    },
  }
};
</script>

<style scoped>
body {
  /* background: #0a0e27; */
}

/* Add modal styles */
.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.8);
}

.modal-content {
  background-color: #000000;
  margin: auto;
  padding: 20px;
  border: 1px solid #2d3454;
  width: 80%;
  max-width: 800px;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

/* Existing styles */
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

#main {
  width: 100%;
}

.main {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 64px;
}

.topper {
  margin-bottom: 80px;
}

.movieChar {
  margin-top: -100px !important;
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
  /* text-shadow: 0px -3px 3px rgba(255, 255, 255, 0.2);*/
}

ul.nav-list li a,
a:visited,
a:hover {
  color: #ffffff;
  text-decoration: none;
}

ul.nav-list li:first-child {
  font-weight: bold;
  border-left: none;
  padding-right: 8rem;
}

ul.nav-list li:first-child:hover {
  background-color: rgba(42, 42, 42, 0.0);
}

ul.nav-list li:hover {
  filter: drop-shadow(0 2px 10px rgba(102, 126, 234, 1.0));
}

ul.nav-list li.active {
  background-color: rgba(42, 42, 42, 0.2);
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
  width: -webkit-fill-available;
  /* background-color: #fff; */
  padding: 10px;
  /* color: black; */
  opacity: 1;
  /* Initially hidden */
  transform: translateY(0);
  /* Initially at normal position */
  transition: opacity 0.3s ease, transform 0.3s ease;
  /* Transition for both */
}

div:hover>.movie-overview {
  opacity: 1;
  /* Fade in */
  transform: translateY(-0px);
  /* Move the element up */
}

#app {
  width: 98%;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

a,
.green {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1);
  transition: 0.4s;
  padding: 3px;
}

@media (hover: hover) {
  a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}

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
  background-color: #181818;
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

.movieChar {
  width: 90%;
  margin: 0 auto;
}

.actorsz {
  display: flex;
  flex-wrap: wrap;
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
  margin: 12px;
}

.movie-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.actor-image {
  width: 250px;
  padding: 0 12px 0 12px;
  margin-bottom: 18px;
  background: #0f1329;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
  cursor: pointer;
  text-align: center;
  cursor: pointer;
}


.movie-content {
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  width: 100%;
  max-width: 120rem;
  margin: 0px auto 7rem;
  transition: all 600mscubic-bezier(0.215, 0.61, 0.355, 1) 0s;
}

.movie-poster {
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  display: flex;
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  background: #0f1329;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
  border: 1px solid #2d3454;
  text-align: center;
}

.movie-title {
  font-size: 4rem;
  font-weight: 200;
  line-height: 1.2;
  color: var(--color-primary-dark);
  letter-spacing: -0.5px;
  text-transform: uppercase;
}

.movie-img {
  max-height: 100%;
  width: 380px;
  height: auto;
  object-fit: cover;
  border-radius: 0.8rem;
  box-shadow: 0rem 2rem 5rem var(--shadow-color-dark);
}

.movie-data {
  width: 100%;
  max-width: 60%;
  padding: 0rem 2rem 0rem 2rem;
  flex: 1 1 60%;
  margin-top: -180px;
}

.movie-inner {
  display: flex;
  width: 100%;
  flex-direction: column;
}

.movie-container {
  width: 90%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  padding: 3rem 2rem;
  margin-top: 12px;
}

.movie-tags {
  text-align: center;
  padding: 18px 0 18px 0;
}

.movie-fields {
  color: var(--color-primary-dark);
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 1rem;
  font-size: 1.4rem;
  text-indent: 2rem;
}

.modalButton {
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
  width: 50%;
}

.modalButton:hover {
  background: linear-gradient(to bottom, #252a4a 0%, #1a1f3a 100%);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

.movie-rating {
  display: inline-flex;
  white-space: nowrap;
  align-items: center;
  align-content: center;
  border: 1px solid rgba(255, 255, 255, .6);
  color: rgba(255, 255, 255, .6);
  line-height: 1;
  border-radius: 2px;
  margin-right: 7px;
  width: auto;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  font-size: 1.4rem;
}

.provider-logo {
  width: 50px;
  height: 50px;
  margin-left: 5px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, .6);
}

.favoriteButton {
  padding: 8px 18px;
  background: #ffb400;
  color: #222;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-bottom: 10px;
  margin-top: 10px;
  transition: background 0.2s;
}

.favoriteButton:hover {
  background: #ffd700;
}

.nostyle {
  text-decoration: none;
  color: #333;
}

.nostyle:hover {
  text-decoration: none;
  color: inherit;
  background: none;
}

.fav {
  color: #ffb400 !important;
  font-weight: bold;
}


/* span + span::before {
    font-size: 1.1em;
    line-height: 1;
    content: "•";
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
    left: 7px;
    display: inline-flex;
    align-content: center;
    align-items: center;
    z-index: -1;
} */

/* Ollama Chat Styles */
.ollama-chat-container {
  position: fixed;
  bottom: 20px;
  right: 60px;
  width: 350px;
  height: 500px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.ollama-chat-header {
  padding: 12px 16px;
  background: linear-gradient(to bottom, #252a4a 0%, #1a1f3a 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ffffff;
}

.ollama-chat-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.close-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  min-width: 44px;
  /* Minimum touch target size */
  min-height: 44px;
  /* Minimum touch target size */
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  /* Improve touch responsiveness */
}

.close-button:hover {
  color: #fff;
}

.close-button:active {
  transform: scale(0.95);
  /* Visual feedback on tap */
}

.ollama-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
}

.message.user {
  align-self: flex-end;
  background: #0f1329;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant {
  align-self: flex-start;
  background: #0f1329;
  color: #fff;
  border-bottom-left-radius: 4px;
}

.message.system {
  align-self: center;
  background: #0f1329;
  color: #ccc;
  font-style: italic;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 90%;
}

.ollama-chat-input {
  padding: 12px;
  border-top: 1px solid #444;
  display: flex;
  gap: 8px;
}

.send-button {
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

.ollama-chat-input textarea {
  flex: 1;
  border: 1px solid #2d3454;
  /* border-radius: 25px; */
  outline: none;
  transition: all 0.3s;
  background: #0f1329;
  color: #ffffff;
  border-radius: 4px;
  padding: 8px 12px;
  resize: none;
  font-family: inherit;
}

.message-content {
  white-space: pre-wrap;
  background: #0f1329;
  /* Preserve whitespace and line breaks */
  word-wrap: break-word;
  /* Break long words */
}

.ollama-chat-input button {
  background-color: #0b6fcb;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0 16px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
  /* Minimum touch target size */
  touch-action: manipulation;
  /* Improve touch responsiveness */
}

.ollama-chat-input button:hover {
  background-color: #0958a2;
}

.ollama-chat-input button:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.ollama-chat-input button:active {
  transform: scale(0.98);
  /* Visual feedback on tap */
}

.loading-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
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

.nav-link:hover {
  background-color: rgba(255, 180, 0, 0.1);
  color: #ffb400;
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
    background-color: #fff;
    flex-direction: column;
    padding-top: 80px;
    transition: right 0.3s ease;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
    z-index: 101;
    overflow-y: auto;
    /* Enable vertical scrolling */
    overflow-x: hidden;
    /* Prevent horizontal scrolling */
  }

  .nav-menu.is-active {
    right: 0;
  }

  .nav-list {
    flex-direction: column;
    width: 100%;
    gap: 0;
    padding-bottom: 20px;
    /* Add padding at bottom for better scrolling */
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

  .ollama-chat-container {
    width: 400px;
    height: 550px;
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

.provider-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}
</style>
