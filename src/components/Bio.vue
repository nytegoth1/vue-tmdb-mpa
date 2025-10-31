<template>
  <div class="main topper">
    <ul class="nav">
      <li><router-link to="/">TMDB Movie Search</router-link></li>
    </ul>
  </div>
  <div class="actor-bio">
    <div v-if="loading">Loading actor information...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="actorData" class="actor-container">
      <div class="actor-header">
        <div class="actor-image-container">
          <img
            :src="actorData.profile_path ? 'https://image.tmdb.org/t/p/w500' + actorData.profile_path : 'https://placehold.co/500x750?text=No+Image'"
            :alt="actorData.name" class="actor-profile-image" />
        </div>
        <div class="actor-info">
          <h1>{{ actorData.name }}</h1>
          <div v-if="actorData.birthday" class="actor-detail">
            <strong>Born:</strong> {{ formatDate(actorData.birthday) }}
            <span v-if="actorData.deathday">- Died: {{ formatDate(actorData.deathday) }}</span>
          </div>
          <div v-if="actorData.place_of_birth" class="actor-detail">
            <strong>Place of birth:</strong> {{ actorData.place_of_birth }}
          </div>
          <div class="actor-bio-text">
            <h3>Biography</h3>
            <p>{{ actorData.biography || 'No biography available.' }}</p>
          </div>
        </div>
      </div>

      <div class="actor-filmography" v-if="credits && credits.cast && credits.cast.length">
        <h2>Known For</h2>
        <div class="films-container">
          <div v-for="movie in sortedFilmography" :key="movie.id" class="film-card">
            <router-link :to="'/moviedetails/' + movie.id">
              <img
                :src="movie.poster_path ? 'https://image.tmdb.org/t/p/w200' + movie.poster_path : 'https://placehold.co/200x300?text=No+Image'"
                :alt="movie.title" class="film-poster" />
            </router-link>
            <div class="film-info">
              <div class="film-title">{{ movie.title }}</div>
              <div class="film-character">{{ movie.character }}</div>
              <div class="film-year">{{ movie.release_date ? movie.release_date.substring(0, 4) : 'N/A' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const apiKey = import.meta.env.VITE_APP_API_KEY;

export default {
  name: 'Bio',
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      actorData: null,
      credits: null,
      loading: true,
      error: null
    };
  },
  computed: {
    sortedFilmography() {
      if (!this.credits || !this.credits.cast) return [];

      // Sort by release date (newest first) and limit to top 200
      return [...this.credits.cast]
        .sort((a, b) => {
          // Handle missing release dates
          if (!a.release_date) return 1;  // Put items with no date at the end
          if (!b.release_date) return -1;

          // Compare dates (newer movies first)
          return new Date(b.release_date) - new Date(a.release_date);
        })
        .slice(0, 200);
    }
  },
  created() {
    this.fetchActorData();
  },
  methods: {
    async fetchActorData() {
      this.loading = true;
      this.error = null;

      try {
        // Fetch actor details
        const actorResponse = await axios.get(
          `https://api.themoviedb.org/3/person/${this.id}?api_key=${apiKey}&language=en-US`
        );
        this.actorData = actorResponse.data;

        // Fetch actor's movie credits
        const creditsResponse = await axios.get(
          `https://api.themoviedb.org/3/person/${this.id}/movie_credits?api_key=${apiKey}&language=en-US`
        );
        this.credits = creditsResponse.data;

        this.loading = false;
      } catch (err) {
        console.error('Error fetching actor data:', err);
        this.error = 'Error loading actor information';
        this.loading = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'Unknown';

      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
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
};

</script>

<style scoped>
.actor-bio {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #fff;
}

.error {
  color: #ff5252;
  font-size: 18px;
  text-align: center;
  margin: 20px 0;
}

.actor-container {
  background-color: #222;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  background: linear-gradient(to bottom, #1a1f3a 0%, #0f1329 100%);
  -webkit-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  -moz-box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
  box-shadow: 0px 2px 1px rgba(50, 50, 50, 0.22);
}

.actor-header {
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
}

.actor-image-container {
  flex: 0 0 300px;
  margin-right: 30px;
}

.actor-profile-image {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #2d3454;
}

.actor-info {
  flex: 1;
  min-width: 300px;
}

.actor-info h1 {
  margin-top: 0;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
}

.actor-detail {
  margin: 10px 0;
  font-size: 16px;
}

.actor-bio-text {
  margin-top: 20px;
}

.actor-bio-text h3 {
  margin-bottom: 10px;
  font-size: 22px;
}

.actor-bio-text p {
  line-height: 1.6;
}

.actor-filmography {
  padding: 20px;
}

.actor-filmography h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.films-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.film-card {
  background-color: #333;
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: #0f1329;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid #2d3454;
  text-align: center;
}

.film-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.film-poster {
  width: 100%;
  height: 270px;
  object-fit: cover;
}

.film-info {
  padding: 12px;
}

.film-title {
  font-weight: 600;
  margin-bottom: 5px;
}

.film-character {
  font-size: 14px;
  color: #aaa;
  font-style: italic;
}

.film-year {
  margin-top: 5px;
  font-size: 14px;
  color: #888;
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

ul.nav li a {
  color: #ffffff;
  text-decoration: none;
}

ul.nav li a:hover {
  filter: drop-shadow(0 2px 10px rgba(102, 126, 234, 1.0));
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

#main {
  width: 100%;
}

.nav {
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

.main {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 80px;
}
</style>