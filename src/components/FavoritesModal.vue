<template>
  <div class="modal-overlay" v-if="show" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h2>My Favorites</h2>
        <button class="close-button" @click="close">&times;</button>
      </div>

      <div class="modal-content">
        <div v-if="favorites.length === 0" class="no-favorites">
          No favorites added yet
        </div>

        <div v-else class="favorites-grid">
          <div v-for="movie in favorites" :key="movie.id" class="favorite-item">
            <img
              :src="movie.poster_path ? 'https://image.tmdb.org/t/p/w200' + movie.poster_path : 'https://placehold.co/200x300?text=No+Image'"
              :alt="movie.title" class="favorite-poster" />
            <div class="favorite-info">
              <h3>{{ movie.title }}</h3>
              <p>{{ movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A' }}</p>
              <div class="favorite-actions">
                <button class="view-button" @click="viewDetails(movie.id)">
                  View Details
                </button>
                <button class="remove-button" @click="removeFromFavorites(movie.id)">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FavoritesModal',
  props: {
    show: Boolean,
    favoriteIds: Array
  },
  data() {
    return {
      favorites: []
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadFavoriteMovies()
      }
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    async viewDetails(movieId) {
      this.close();
      await this.$router.push(`/moviedetails/${movieId}`);
      // Emit an event to notify parent to refresh data
      this.$emit('movie-selected', movieId);
    },
    removeFromFavorites(movieId) {
      this.$emit('remove-favorite', movieId)
      this.favorites = this.favorites.filter(movie => movie.id !== movieId)
    },
    async loadFavoriteMovies() {
      const apiKey = import.meta.env.VITE_APP_API_KEY;
      this.favorites = []

      for (const id of this.favoriteIds) {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`
          )
          if (response.ok) {
            const movie = await response.json()
            this.favorites.push(movie)
          }
        } catch (error) {
          console.error(`Error loading favorite movie ${id}:`, error)
        }
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: #222;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #333;
}

.close-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
}

.modal-content {
  padding: 1rem;
  overflow-y: auto;
  max-height: calc(90vh - 60px);
  overflow: scroll;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 100px;
}

.favorite-item {
  display: flex;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.favorite-poster {
  width: 100px;
  height: 150px;
  object-fit: cover;
}

.favorite-info {
  flex: 1;
  padding: 1rem;
}

.favorite-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.view-button,
.remove-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.view-button {
  background: #007bff;
  color: white;
  text-decoration: none;
}

.remove-button {
  background: #dc3545;
  color: white;
}
</style>